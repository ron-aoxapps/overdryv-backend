const prisma = require('../../../client/prismaClient');
const { sendSuccess, sendError } = require('../../../utils/responses');
const { CODES } = require('../../../utils/statusCodes');

const vehicleController = {};

const serializeVehicle = (vehicle) => ({
  id: vehicle.id,
  organization_id: vehicle.organization_id,
  vin: vehicle.vin,
  make: vehicle.make,
  model: vehicle.model,
  year: vehicle.year,
  color: vehicle.color,
  mileage: vehicle.mileage,
  license_plate: vehicle.license_plate,
  created_at: vehicle.created_at,
  updated_at: vehicle.updated_at,
  customer: vehicle.customer
    ? {
        id: vehicle.customer.id,
        first_name: vehicle.customer.first_name,
        last_name: vehicle.customer.last_name,
        email: vehicle.customer.email,
        phone: vehicle.customer.phone ?? null,
      }
    : null,
  work_orders: vehicle.work_orders.map((wo) => ({
    id: wo.id,
    status: wo.status,
    description: wo.description,
    created_at: wo.created_at,
  })),
});

   
vehicleController.getVehicleStats = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const [totalVehicles, vehicles, revenueResult, mileageResult] =
      await Promise.all([
        prisma.vehicle.count({
          where: { organization_id: organizationId },
        }),

        prisma.vehicle.findMany({
          where: { organization_id: organizationId },
          select: {
            id: true,
            work_orders: {
              orderBy: { created_at: "desc" },
              take: 1,
              select: {
                created_at: true,
              },
            },
          },
        }),

        prisma.workOrder.aggregate({
          where: { organization_id: organizationId },
          _sum: { total_amount: true },
        }),

        prisma.vehicle.aggregate({
          where: {
            organization_id: organizationId,
            mileage: { not: null },
          },
          _avg: { mileage: true },
        }),
      ]);

    // -------- Overdue Service Calculation --------
    const now = new Date();
    const overdueDays = 120;

    let overdueService = 0;

    vehicles.forEach((vehicle) => {
      if (vehicle.work_orders.length > 0) {
        const lastServiceDate = new Date(vehicle.work_orders[0].created_at);

        const diffDays =
          (now.getTime() - lastServiceDate.getTime()) /
          (1000 * 60 * 60 * 24);

        if (diffDays > overdueDays) {
          overdueService++;
        }
      }
    });

    // -------- Revenue --------
    const totalRevenue = revenueResult._sum.total_amount
      ? Number(revenueResult._sum.total_amount)
      : 0;

    // -------- Average Mileage --------
    const avgMileage = mileageResult._avg.mileage
      ? Math.round(Number(mileageResult._avg.mileage))
      : 0;

    return sendSuccess(
      res,
      {
        total_vehicles: totalVehicles,
        overdue_service: overdueService,
        total_revenue: totalRevenue,
        avg_mileage: avgMileage,
      },
      "Vehicle stats fetched successfully"
    );
  } catch (err) {
    return sendError(res, err, "Failed to fetch vehicle stats", CODES.SERVER_ERROR);
  }
};

//  Query params:
//  *   page       (default 1)
//  *   limit      (default 10)
//  *   search     - matches make, model, vin, license_plate (case-insensitive)
//  *   sortBy     - created_at | updated_at | make | model | year | license_plate (default: created_at)
//  *   sortOrder  - asc | desc (default: desc)
//  */
vehicleController.getAllVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const organizationId = req.organizationId;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    const allowedSortFields = ['created_at', 'updated_at', 'make', 'model', 'year', 'license_plate'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    const where = { organization_id: organizationId };

    if (search) {
      where.OR = [
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
        { license_plate: { contains: search, mode: 'insensitive' } },
        { customer: { first_name: { contains: search, mode: 'insensitive' } } },
        { customer: { last_name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: { [sortField]: order },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          customer: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
            },
          },
          work_orders: {
            select: {
              id: true,
              status: true,
              description: true,
              created_at: true,
            },
          },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return sendSuccess(
      res,
      {
        vehicles: vehicles.map(serializeVehicle),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Vehicles fetched successfully',
    );
  } catch (err) {
    return sendError(res, err, 'Failed to fetch vehicles', CODES.SERVER_ERROR);
  }
};

// PATCH /vehicles/:vehicleId
vehicleController.updateVehicle = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { vehicleId } = req.params;

    const { vin, make, model, year, color, mileage, license_plate } = req.body;

    if (!vehicleId) {
      return sendError(res, {}, "Vehicle ID is required", CODES.BAD_REQUEST);
    }

    // Check vehicle exists in this organization
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        organization_id: organizationId,
      },
    });

    if (!existingVehicle) {
      return sendError(res, {}, "Vehicle not found", CODES.NOT_FOUND);
    }

    // Build update payload
    const data = { updated_at: new Date() };

    if (vin !== undefined) data.vin = vin;
    if (make !== undefined) data.make = make;
    if (model !== undefined) data.model = model;
    if (year !== undefined) data.year = year;
    if (color !== undefined) data.color = color;
    if (mileage !== undefined) {
      if (mileage < 0) {
        return sendError(res, {}, "Mileage cannot be negative", CODES.BAD_REQUEST);
      }
      data.mileage = mileage;
    }
    if (license_plate !== undefined) data.license_plate = license_plate;

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data,
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        work_orders: {
          select: {
            id: true,
            status: true,
            description: true,
            created_at: true,
          },
        },
      },
    });

    return sendSuccess(
      res,
      { vehicle: serializeVehicle(updatedVehicle) },
      "Vehicle updated successfully"
    );
  } catch (err) {
    return sendError(res, err, "Failed to update vehicle", CODES.SERVER_ERROR);
  }
};

// POST /vehicles
vehicleController.createVehicle = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { customer_id, year, make, model, vin, color, mileage, license_plate } = req.body;

    if (!customer_id || !year) {
      return sendError(res, {}, 'customer_id and year are required', CODES.BAD_REQUEST);
    }

    if (typeof year !== 'number' || year < 1886 || year > new Date().getFullYear() + 2) {
      return sendError(res, {}, 'Invalid year', CODES.BAD_REQUEST);
    }

    // Verify the customer belongs to this organization
    const customer = await prisma.profile.findFirst({
      where: { id: customer_id, organization_id: organizationId, role: 'customer' },
      select: { id: true },
    });

    if (!customer) {
      return sendError(res, {}, 'Customer not found', CODES.NOT_FOUND);
    }

    // VIN uniqueness check (VIN is globally unique in the Vehicle table)
    if (vin) {
      const vinConflict = await prisma.vehicle.findFirst({ where: { vin } });
      if (vinConflict) {
        return sendError(res, {}, 'A vehicle with this VIN already exists', CODES.CONFLICT);
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        customer_id,
        organization_id: organizationId,
        year,
        make: make ?? null,
        model: model ?? null,
        vin: vin ?? null,
        color: color ?? null,
        mileage: mileage ?? null,
        license_plate: license_plate ?? null,
      },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        work_orders: {
          select: {
            id: true,
            status: true,
            description: true,
            created_at: true,
          },
        },
      },
    });

    return sendSuccess(
      res,
      { vehicle: serializeVehicle(vehicle) },
      'Vehicle created successfully',
      CODES.CREATED,
    );
  } catch (err) {
    return sendError(res, err, 'Failed to create vehicle', CODES.SERVER_ERROR);
  }
};

// GET /vehicles/customer/:customerId  — all vehicles for a customer (no pagination)
vehicleController.listCustomerVehicles = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { customerId } = req.params;

    // Verify customer belongs to this org
    const customer = await prisma.profile.findFirst({
      where: { id: customerId, organization_id: organizationId, role: 'customer' },
      select: { id: true },
    });

    if (!customer) {
      return sendError(res, {}, 'Customer not found', CODES.NOT_FOUND);
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { customer_id: customerId, organization_id: organizationId },
      orderBy: { created_at: 'desc' },
    });

    return sendSuccess(res, { vehicles }, 'Vehicles fetched successfully');
  } catch (err) {
    return sendError(res, err, 'Failed to fetch vehicles', CODES.SERVER_ERROR);
  }
};

module.exports = vehicleController;
