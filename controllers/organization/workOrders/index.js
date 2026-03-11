const prisma = require('../../../client/prismaClient');
const { sendSuccess, sendError } = require('../../../utils/responses');
const { CODES } = require('../../../utils/statusCodes');

const workOrderController = {};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

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
  service_items: wo.service_items
    ? wo.service_items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity ? Number(item.quantity) : 1,
        unit_price: item.unit_price ? Number(item.unit_price).toFixed(2) : '0.00',
        total_price: item.total_price ? Number(item.total_price).toFixed(2) : '0.00',
        item_type: item.item_type,
        created_at: item.created_at,
      }))
    : [],
});

const fullInclude = {
  customer: {
    select: { id: true, first_name: true, last_name: true, email: true },
  },
  vehicle: {
    select: { id: true, year: true, make: true, model: true, vin: true, license_plate: true },
  },
  technician: {
    select: { id: true, first_name: true, last_name: true },
  },
  service_items: true,
};

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

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
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

// GET /work-orders/:id
workOrderController.getWorkOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.organizationId;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, organization_id: organizationId },
      include: fullInclude,
    });

    if (!workOrder) {
      return sendError(res, {}, 'Work order not found', CODES.NOT_FOUND);
    }

    return sendSuccess(
      res,
      { work_order: serializeWorkOrder(workOrder) },
      'Work order fetched successfully',
    );
  } catch (err) {
    return sendError(res, err, 'Failed to fetch work order', CODES.SERVER_ERROR);
  }
};

// POST /work-orders
// Body: { customer_id, vehicle_id, total_amount, sub_total, card_fee, services: [...] }
workOrderController.createWorkOrder = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const {
      customer_id,
      vehicle_id,
      total_amount,
      technician_id,
      scheduled_start,
      scheduled_end,
      estimated_completion,
      services = [],
    } = req.body;

    // Derive top-level WO fields from the first service that has values
    const firstService = services.find((s) => s.service_type) || services[0] || {};
    const service_type = firstService.service_type || 'General Service';
    const description = firstService.description || '';
    const priority = firstService.priority || 'normal';
    const notes = firstService.notes || null;

    // Flatten all service items across all service groups
    const allServiceItems = [];
    for (const service of services) {
      for (const item of service.serviceItems || []) {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unit_price) || 0;
        allServiceItems.push({
          description: item.description || '',
          quantity: qty,
          unit_price: price,
          total_price: qty * price,
          item_type: item.item_type || 'labor',
          organization_id: organizationId,
        });
      }
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        customer_id: customer_id || null,
        vehicle_id: vehicle_id || null,
        service_type,
        description,
        priority,
        notes,
        total_amount: total_amount || 0,
        technician_id: technician_id || null,
        scheduled_start: scheduled_start || null,
        scheduled_end: scheduled_end || null,
        estimated_completion: estimated_completion || null,
        organization_id: organizationId,
        service_items: {
          createMany: { data: allServiceItems },
        },
      },
      include: fullInclude,
    });

    return sendSuccess(
      res,
      { work_order: serializeWorkOrder(workOrder) },
      'Work order created successfully',
      CODES.CREATED,
    );
  } catch (err) {
    return sendError(res, err, 'Failed to create work order', CODES.SERVER_ERROR);
  }
};

// PUT /work-orders/:id
workOrderController.updateWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const {
      customer_id,
      vehicle_id,
      status,
      total_amount,
      technician_id,
      scheduled_start,
      scheduled_end,
      estimated_completion,
      actual_completion,
      services,
    } = req.body;

    const existing = await prisma.workOrder.findFirst({
      where: { id, organization_id: organizationId },
    });

    if (!existing) {
      return sendError(res, {}, 'Work order not found', CODES.NOT_FOUND);
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return sendError(
        res,
        {},
        `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
        CODES.BAD_REQUEST,
      );
    }

    // Build top-level update data
    const updateData = { updated_at: new Date() };
    if (customer_id !== undefined) updateData.customer_id = customer_id || null;
    if (vehicle_id !== undefined) updateData.vehicle_id = vehicle_id || null;
    if (technician_id !== undefined) updateData.technician_id = technician_id || null;
    if (status !== undefined) updateData.status = status;
    if (total_amount !== undefined) updateData.total_amount = total_amount;
    if (scheduled_start !== undefined) updateData.scheduled_start = scheduled_start || null;
    if (scheduled_end !== undefined) updateData.scheduled_end = scheduled_end || null;
    if (estimated_completion !== undefined) updateData.estimated_completion = estimated_completion || null;
    if (actual_completion !== undefined) updateData.actual_completion = actual_completion || null;

    if (services !== undefined) {
      const firstService = services.find((s) => s.service_type) || services[0] || {};
      if (firstService.service_type !== undefined) updateData.service_type = firstService.service_type || existing.service_type;
      if (firstService.description !== undefined) updateData.description = firstService.description;
      if (firstService.priority !== undefined) updateData.priority = firstService.priority;
      if (firstService.notes !== undefined) updateData.notes = firstService.notes;
    }

    // Replace service items if services array is provided
    const workOrder = await prisma.$transaction(async (tx) => {
      if (services !== undefined) {
        await tx.serviceItem.deleteMany({ where: { work_order_id: id } });

        const allServiceItems = [];
        for (const service of services) {
          for (const item of service.serviceItems || []) {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unit_price) || 0;
            allServiceItems.push({
              description: item.description || '',
              quantity: qty,
              unit_price: price,
              total_price: qty * price,
              item_type: item.item_type || 'labor',
              work_order_id: id,
              organization_id: organizationId,
            });
          }
        }

        if (allServiceItems.length > 0) {
          await tx.serviceItem.createMany({ data: allServiceItems });
        }
      }

      return tx.workOrder.update({
        where: { id },
        data: updateData,
        include: fullInclude,
      });
    });

    return sendSuccess(
      res,
      { work_order: serializeWorkOrder(workOrder) },
      'Work order updated successfully',
    );
  } catch (err) {
    return sendError(res, err, 'Failed to update work order', CODES.SERVER_ERROR);
  }
};

// DELETE /work-orders/:id
workOrderController.deleteWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.organizationId;

    const existing = await prisma.workOrder.findFirst({
      where: { id, organization_id: organizationId },
    });

    if (!existing) {
      return sendError(res, {}, 'Work order not found', CODES.NOT_FOUND);
    }

    await prisma.workOrder.delete({ where: { id } });

    return sendSuccess(res, {}, 'Work order deleted successfully');
  } catch (err) {
    return sendError(res, err, 'Failed to delete work order', CODES.SERVER_ERROR);
  }
};

module.exports = workOrderController;
