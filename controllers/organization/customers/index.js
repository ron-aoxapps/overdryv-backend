const prisma = require('../../../client/prismaClient');
const { sendSuccess, sendError } = require('../../../utils/responses');
const { CODES } = require('../../../utils/statusCodes');

const customerController = {};

const serializeCustomer = (customer) => ({
  id: customer.id,
  email: customer.email,
  first_name: customer.first_name,
  last_name: customer.last_name,
  phone: customer.phone ?? null,
  address: customer.address ?? null,
  customer_notes: customer.customer_notes ?? null,
  role: customer.role,
  organization_id: customer.organization_id,
  created_at: customer.created_at,
  updated_at: customer.updated_at,
  vehicles: customer.vehicles.map((v) => ({
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    color: v.color,
    license_plate: v.license_plate,
  })),
  work_orders: customer.work_orders_customer.map((wo) => ({
    id: wo.id,
    status: wo.status,
    description: wo.description,
    created_at: wo.created_at,
  })),
});

// GET /customers?page=1&limit=10&search=john&sortBy=created_at&sortOrder=desc
customerController.getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const organizationId = req.organizationId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    const allowedSortFields = ['created_at', 'updated_at', 'first_name', 'last_name', 'email'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    const where = {
      organization_id: organizationId,
      role: 'customer',
    };

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        orderBy: { [sortField]: order },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          vehicles: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              color: true,
              license_plate: true,
            },
          },
          work_orders_customer: {
            select: {
              id: true,
              status: true,
              description: true,
              created_at: true,
            },
          },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    return sendSuccess(
      res,
      {
        customers: customers.map(serializeCustomer),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Customers fetched successfully',
    );
  } catch (err) {
    return sendError(res, err, 'Failed to fetch customers', CODES.SERVER_ERROR);
  }
};

// GET /customers/stats
customerController.getCustomerStats = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const [totalCustomers, totalVehicles, revenueResult] = await Promise.all([
      // Count all customer profiles for this org
      prisma.profile.count({
        where: { organization_id: organizationId, role: 'customer' },
      }),

      // Count all vehicles belonging to customers of this org
      prisma.vehicle.count({
        where: { organization_id: organizationId },
      }),

      // Sum total_amount across all work orders for this org
      prisma.workOrder.aggregate({
        where: { organization_id: organizationId },
        _sum: { total_amount: true },
      }),
    ]);

    const totalRevenue = revenueResult._sum.total_amount
      ? Number(revenueResult._sum.total_amount)
      : 0;

    const avgCustomerValue =
      totalCustomers > 0
        ? Math.round(totalRevenue / totalCustomers)
        : 0;

    return sendSuccess(
      res,
      {
        total_customers: totalCustomers,
        total_vehicles: totalVehicles,
        total_revenue: totalRevenue,
        avg_customer_value: avgCustomerValue,
      },
      'Customer stats fetched successfully',
    );
  } catch (err) {
    return sendError(res, err, 'Failed to fetch customer stats', CODES.SERVER_ERROR);
  }
};

// GET /customers/:customerId/work-orders
customerController.getCustomerWorkOrders = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { customerId } = req.params;

    // Verify the customer belongs to this organization
    const customer = await prisma.profile.findFirst({
      where: { id: customerId, organization_id: organizationId, role: 'customer' },
      select: { id: true, first_name: true, last_name: true, email: true },
    });

    if (!customer) {
      return sendError(res, {}, 'Customer not found', CODES.NOT_FOUND);
    }

    const workOrders = await prisma.workOrder.findMany({
      where: { customer_id: customerId, organization_id: organizationId },
      orderBy: { created_at: 'desc' },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            color: true,
            license_plate: true,
          },
        },
        technician: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoice_number: true,
            status: true,
            subtotal: true,
            tax_amount: true,
            total_amount: true,
            amount_paid: true,
            amount_due: true,
            invoice_date: true,
            due_date: true,
            paid_at: true,
          },
        },
        service_items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unit_price: true,
            total_price: true,
            item_type: true,
          },
        },
      },
    });

    // Summary stats
    const totalServices = workOrders.length;
    const totalSpent = workOrders.reduce(
      (sum, wo) => sum + (wo.total_amount ? Number(wo.total_amount) : 0),
      0,
    );
    const avgService = totalServices > 0 ? totalSpent / totalServices : 0;

    const serialize = (wo) => ({
      id: wo.id,
      work_order_number: wo.work_order_number,
      number: wo.number,
      status: wo.status,
      service_type: wo.service_type,
      description: wo.description,
      notes: wo.notes,
      priority: wo.priority,
      total_amount: wo.total_amount ? Number(wo.total_amount).toFixed(2) : '0.00',
      estimated_completion: wo.estimated_completion,
      actual_completion: wo.actual_completion,
      scheduled_start: wo.scheduled_start,
      scheduled_end: wo.scheduled_end,
      created_at: wo.created_at,
      updated_at: wo.updated_at,
      vehicle: wo.vehicle,
      technician: wo.technician
        ? {
            id: wo.technician.id,
            name: `${wo.technician.first_name} ${wo.technician.last_name}`,
            email: wo.technician.email,
          }
        : null,
      invoices: wo.invoices.map((inv) => ({
        ...inv,
        subtotal: Number(inv.subtotal).toFixed(2),
        tax_amount: inv.tax_amount ? Number(inv.tax_amount).toFixed(2) : '0.00',
        total_amount: Number(inv.total_amount).toFixed(2),
        amount_paid: inv.amount_paid ? Number(inv.amount_paid).toFixed(2) : '0.00',
        amount_due: Number(inv.amount_due).toFixed(2),
      })),
      service_items: wo.service_items.map((item) => ({
        ...item,
        quantity: item.quantity ? Number(item.quantity) : 1,
        unit_price: item.unit_price ? Number(item.unit_price).toFixed(2) : '0.00',
        total_price: item.total_price ? Number(item.total_price).toFixed(2) : '0.00',
      })),
    });

    return sendSuccess(
      res,
      {
        customer,
        stats: {
          total_services: totalServices,
          total_spent: totalSpent.toFixed(2),
          avg_service: avgService.toFixed(2),
        },
        work_orders: workOrders.map(serialize),
      },
      'Customer work orders fetched successfully',
    );
  } catch (err) {
    return sendError(res, err, 'Failed to fetch customer work orders', CODES.SERVER_ERROR);
  }
};

// PATCH /customers/:customerId
customerController.updateCustomer = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { customerId } = req.params;
    const { email, phone, address, customer_notes } = req.body;

    // At least one field must be provided
    if (email === undefined && phone === undefined && address === undefined && customer_notes === undefined) {
      return sendError(res, {}, 'No fields provided to update', CODES.BAD_REQUEST);
    }

    // Verify the customer exists and belongs to this organization
    const existing = await prisma.profile.findFirst({
      where: { id: customerId, organization_id: organizationId, role: 'customer' },
    });

    if (!existing) {
      return sendError(res, {}, 'Customer not found', CODES.NOT_FOUND);
    }

    // Build update payload
    const data = { updated_at: new Date() };

    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      // Check global uniqueness (email is unique across the entire Profile table)
      const emailConflict = await prisma.profile.findFirst({
        where: { email: trimmedEmail, NOT: { id: customerId } },
      });
      if (emailConflict) {
        return sendError(res, {}, 'Email is already in use', CODES.CONFLICT);
      }
      data.email = trimmedEmail;
    }

    if (phone !== undefined) {
      data.phone = phone;
    }

    if (address !== undefined) {
      // Merge with existing address (upsert behaviour — creates if missing)
      data.address = {
        ...(existing.address ?? {}),
        ...address,
      };
    }

    if (customer_notes !== undefined) {
      data.customer_notes = customer_notes;
    }

    const updated = await prisma.profile.update({
      where: { id: customerId },
      data,
      include: {
        vehicles: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            color: true,
            license_plate: true,
          },
        },
        work_orders_customer: {
          select: {
            id: true,
            status: true,
            description: true,
            created_at: true,
          },
        },
      },
    });

    return sendSuccess(res, { customer: serializeCustomer(updated) }, 'Customer updated successfully');
  } catch (err) {
    return sendError(res, err, 'Failed to update customer', CODES.SERVER_ERROR);
  }
};

// POST /customers
customerController.createCustomer = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { first_name, last_name, email, phone, address, customer_notes } = req.body;

    if (!first_name || !last_name || !email) {
      return sendError(res, {}, 'first_name, last_name, and email are required', CODES.BAD_REQUEST);
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Email must be unique globally
    const existing = await prisma.profile.findFirst({
      where: { email: trimmedEmail },
    });
    if (existing) {
      return sendError(res, {}, 'Email is already in use', CODES.CONFLICT);
    }

    const customer = await prisma.profile.create({
      data: {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: trimmedEmail,
        phone: phone ?? null,
        address: address ?? null,
        customer_notes: customer_notes ?? null,
        role: 'customer',
        organization_id: organizationId,
      },
      include: {
        vehicles: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            color: true,
            license_plate: true,
          },
        },
        work_orders_customer: {
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
      { customer: serializeCustomer(customer) },
      'Customer created successfully',
      CODES.CREATED,
    );
  } catch (err) {
    return sendError(res, err, 'Failed to create customer', CODES.SERVER_ERROR);
  }
};

// GET /customers/list  — lightweight list for dropdowns (no pagination)
customerController.listAllCustomers = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const customers = await prisma.profile.findMany({
      where: { organization_id: organizationId, role: 'customer' },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });

    return sendSuccess(res, { customers }, 'Customers fetched successfully');
  } catch (err) {
    return sendError(res, err, 'Failed to fetch customers', CODES.SERVER_ERROR);
  }
};

// GET /customers/search?q=value
// GET /customers/search?q=value
customerController.searchCustomer = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { q } = req.query;

    if (!q || !q.trim()) {
      return sendError(res, {}, "Search query is required", CODES.BAD_REQUEST);
    }

    const search = q.trim();
    const phoneDigits = search.replace(/\D/g, "");

    const customer = await prisma.profile.findFirst({
      where: {
        organization_id: organizationId,
        role: "customer",
        OR: [
          {
            first_name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            last_name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        vehicles: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            color: true,
            license_plate: true,
          },
        },
        work_orders_customer: {
          select: {
            id: true,
            status: true,
            description: true,
            created_at: true,
          },
        },
      },
    });

    if (!customer) {
      return sendError(res, {}, "Customer not found", CODES.NOT_FOUND);
    }

    // Phone match check ignoring symbols
    if (phoneDigits && customer.phone) {
      const storedDigits = customer.phone.replace(/\D/g, "");
      if (!storedDigits.includes(phoneDigits)) {
        return sendError(res, {}, "Customer not found", CODES.NOT_FOUND);
      }
    }

    return sendSuccess(
      res,
      { customer: serializeCustomer(customer) },
      "Customer fetched successfully"
    );
  } catch (err) {
    return sendError(res, err, "Failed to search customer", CODES.SERVER_ERROR);
  }
};

module.exports = customerController;
