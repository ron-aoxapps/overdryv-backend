const prisma = require('../../../client/prismaClient');
const { sendSuccess, sendError } = require('../../../utils/responses');
const { CODES } = require('../../../utils/statusCodes');

const workOrderController = {};

const ALLOWED_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled', 'waiting_parts'];

const serializeWorkOrder = (wo) => ({
  id: wo.id,
  work_order_number: wo.work_order_number,
  number: wo.number,
  status: wo.status,
  service_type: wo.service_type,
  description: wo.description,
  priority: wo.priority,
  notes: wo.notes,
  total_amount: wo.total_amount ? Number(wo.total_amount).toFixed(2) : '0.00',
  estimated_completion: wo.estimated_completion,
  actual_completion: wo.actual_completion,
  scheduled_start: wo.scheduled_start,
  scheduled_end: wo.scheduled_end,
  organization_id: wo.organization_id,
  created_at: wo.created_at,
  updated_at: wo.updated_at,
  customer: wo.customer
    ? {
        id: wo.customer.id,
        first_name: wo.customer.first_name,
        last_name: wo.customer.last_name,
        email: wo.customer.email,
      }
    : null,
  vehicle: wo.vehicle
    ? {
        id: wo.vehicle.id,
        year: wo.vehicle.year,
        make: wo.vehicle.make,
        model: wo.vehicle.model,
        vin: wo.vehicle.vin,
        license_plate: wo.vehicle.license_plate,
      }
    : null,
  technician: wo.technician
    ? {
        id: wo.technician.id,
        first_name: wo.technician.first_name,
        last_name: wo.technician.last_name,
      }
    : null,
});

// GET /work-orders?page=1&limit=10&status=pending&search=john&sortOrder=desc
workOrderController.getAllWorkOrders = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const {
      page = 1,
      limit = 10,
      status,
      search = '',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    // Validate status filter
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return sendError(
        res,
        {},
        `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
        CODES.BAD_REQUEST,
      );
    }

    const where = { organization_id: organizationId };

    if (status) {
      where.status = status;
    }

    // Search by customer name / email OR vehicle make / model / vin / license_plate
    if (search.trim()) {
      where.OR = [
        { customer: { first_name: { contains: search, mode: 'insensitive' } } },
        { customer: { last_name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { vehicle: { make: { contains: search, mode: 'insensitive' } } },
        { vehicle: { model: { contains: search, mode: 'insensitive' } } },
        { vehicle: { vin: { contains: search, mode: 'insensitive' } } },
        { vehicle: { license_plate: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const include = {
      customer: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          vin: true,
          license_plate: true,
        },
      },
      technician: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    };

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        orderBy: { created_at: order },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include,
      }),
      prisma.workOrder.count({ where }),
    ]);

    return sendSuccess(
      res,
      {
        work_orders: workOrders.map(serializeWorkOrder),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Work orders fetched successfully',
    );
  } catch (err) {
    return sendError(res, err, 'Failed to fetch work orders', CODES.SERVER_ERROR);
  }
};

// GET /work-orders/stats
workOrderController.getWorkOrderStats = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const now = new Date();

    const [total, pending, inProgress, completed, overdue] = await Promise.all([
      prisma.workOrder.count({
        where: { organization_id: organizationId },
      }),
      prisma.workOrder.count({
        where: { organization_id: organizationId, status: 'pending' },
      }),
      prisma.workOrder.count({
        where: { organization_id: organizationId, status: 'in_progress' },
      }),
      prisma.workOrder.count({
        where: { organization_id: organizationId, status: 'completed' },
      }),
      // Overdue: estimated_completion is in the past and not yet completed/cancelled
      prisma.workOrder.count({
        where: {
          organization_id: organizationId,
          estimated_completion: { lt: now },
          status: { notIn: ['completed', 'cancelled'] },
        },
      }),
    ]);

    return sendSuccess(
      res,
      {
        total,
        pending,
        in_progress: inProgress,
        completed,
        overdue,
      },
      'Work order stats fetched successfully',
    );
  } catch (err) {
    return sendError(res, err, 'Failed to fetch work order stats', CODES.SERVER_ERROR);
  }
};

module.exports = workOrderController;
