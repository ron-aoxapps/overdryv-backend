const prisma = require('../../../client/prismaClient');
const { sendSuccess, sendError } = require('../../../utils/responses');
const { CODES } = require('../../../utils/statusCodes');

const partController = {};

// Prisma returns Decimal for unit_cost / retail_price — stringify them
const serializePart = (part) => ({
  id: part.id,
  organization_id: part.organization_id,
  part_number: part.part_number,
  name: part.name,
  description: part.description,
  category: part.category,
  brand: part.brand,
  unit_cost: part.unit_cost != null ? part.unit_cost.toString() : '0',
  retail_price: part.retail_price != null ? part.retail_price.toString() : '0',
  quantity_on_hand: Number(part.quantity_on_hand),
  minimum_stock: Number(part.minimum_stock),
  maximum_stock: part.maximum_stock != null ? Number(part.maximum_stock) : null,
  location: part.location,
  supplier: part.supplier,
  is_active: part.is_active,
  stock_level:
    Number(part.quantity_on_hand) <= Number(part.minimum_stock)
      ? 'low_stock'
      : 'in_stock',
  created_at: part.created_at,
  updated_at: part.updated_at,
});

const SORT_COLUMN_MAP = {
  created_at: 'p.created_at',
  updated_at: 'p.updated_at',
  name: 'p.name',
  brand: 'p.brand',
  part_number: 'p.part_number',
  category: 'p.category',
  quantity_on_hand: 'p.quantity_on_hand',
  unit_cost: 'p.unit_cost',
  retail_price: 'p.retail_price',
};

/**
 * GET /parts
 * Query params:
 *   page        (default 1)
 *   limit       (default 10)
 *   search      - matches name, brand, part_number (case-insensitive)
 *   category    - filter by category (case-insensitive exact match)
 *   stock_level - "low_stock" (qty <= min) | "in_stock" (qty > min)
 *   sortBy      - one of the SORT_COLUMN_MAP keys (default: created_at)
 *   sortOrder   - "asc" | "desc" (default: desc)
 */
partController.getAllParts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      stock_level = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const organizationId = req.organizationId;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    const allowedSortFields = [
      'created_at',
      'updated_at',
      'name',
      'brand',
      'part_number',
      'category',
      'quantity_on_hand',
      'unit_cost',
      'retail_price',
    ];

    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'created_at';

    const where = {
      organization_id: organizationId,
      is_active: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { part_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        equals: category,
        mode: 'insensitive',
      };
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        orderBy: { [sortField]: order },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.part.count({ where }),
    ]);

    // Handle stock level logic in JS
    let filteredParts = parts;

    if (stock_level === 'low_stock') {
      filteredParts = parts.filter(
        (p) => Number(p.quantity_on_hand) <= Number(p.minimum_stock)
      );
    }

    if (stock_level === 'in_stock') {
      filteredParts = parts.filter(
        (p) => Number(p.quantity_on_hand) > Number(p.minimum_stock)
      );
    }

    return sendSuccess(
      res,
      {
        parts: filteredParts.map(serializePart),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Parts fetched successfully'
    );
  } catch (err) {
    return sendError(res, err, 'Failed to fetch parts', CODES.SERVER_ERROR);
  }
};

partController.getPartsStats = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const parts = await prisma.part.findMany({
      where: {
        organization_id: organizationId,
        is_active: true,
      },
      select: {
        id: true,
        category: true,
        minimum_stock: true,
        quantity_on_hand: true,
        unit_cost: true,
      },
    });

   

    let totalParts = parts.length;
    let inventoryValue = 0;
    let lowStock = 0;
    let outOfStock = 0;
    const categories = new Set();

    for (const part of parts) {
      const qty = Number(part.quantity_on_hand);
      const min = Number(part.minimum_stock);
      const price = Number(part.unit_cost);

      inventoryValue += qty * price;

      if (qty === 0) {
        outOfStock++;
      }

      if (qty <= min) {
        lowStock++;
      }

      if (part.category) {
        categories.add(part.category);
      }
    }

    return sendSuccess(
      res,
      {
        totalParts,
        inventoryValue: Number(inventoryValue.toFixed(2)),
        lowStock,
        outOfStock,
        categories: categories.size,
      },
      "Parts stats fetched successfully"
    );
  } catch (err) {
    return sendError(res, err, "Failed to fetch parts stats", CODES.SERVER_ERROR);
  }
};

partController.updateStockQuantity = async (req, res) => {
  try {
    const { partId } = req.params;
    const { quantity } = req.body;

    const organizationId = req.organizationId;

    if (!partId) {
      return sendError(res, {}, "Part ID is required", CODES.BAD_REQUEST);
    }

    if (!quantity || quantity < 0) {
      return sendError(
        res,
        {},
        "Quantity can not be less than 0",
        CODES.BAD_REQUEST
      );
    }

    // Find part that belongs to same organization
    const part = await prisma.part.findFirst({
      where: {
        id: partId,
        organization_id: organizationId,
        is_active: true,
      },
    });

    if (!part) {
      return sendError(
        res,
        {},
        "Part not found or does not belong to your organization",
        CODES.NOT_FOUND
      );
    }

    const updatedPart = await prisma.part.update({
      where: {
        id: part.id,
      },
      data: {
        quantity_on_hand: quantity,
      },
    });

    return sendSuccess(
      res,
      {
        part: serializePart(updatedPart),
      },
      "Stock quantity updated successfully"
    );
  } catch (err) {
    return sendError(res, err, "Failed to update stock", CODES.SERVER_ERROR);
  }
};

partController.updatePart = async (req, res) => {
  try {
    const { partId } = req.params;
    const organizationId = req.organizationId;

    const {
      part_number,
      name,
      description,
      category,
      brand,
      unit_cost,
      retail_price,
      quantity_on_hand,
      minimum_stock,
      maximum_stock,
      location,
      supplier,
      is_active,
    } = req.body;

    if (!partId) {
      return sendError(res, {}, "Part ID is required", CODES.BAD_REQUEST);
    }

    // quantity validation
    if (quantity_on_hand !== undefined && quantity_on_hand < 0) {
      return sendError(
        res,
        {},
        "Quantity on hand cannot be less than 0",
        CODES.BAD_REQUEST
      );
    }

    if (minimum_stock !== undefined && minimum_stock < 0) {
      return sendError(
        res,
        {},
        "Minimum stock cannot be less than 0",
        CODES.BAD_REQUEST
      );
    }

    if (maximum_stock !== undefined && maximum_stock < 0) {
      return sendError(
        res,
        {},
        "Maximum stock cannot be less than 0",
        CODES.BAD_REQUEST
      );
    }

    const data = {};

    if (part_number !== undefined) data.part_number = part_number;
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (brand !== undefined) data.brand = brand;
    if (unit_cost !== undefined) data.unit_cost = unit_cost;
    if (retail_price !== undefined) data.retail_price = retail_price;
    if (quantity_on_hand !== undefined) data.quantity_on_hand = quantity_on_hand;
    if (minimum_stock !== undefined) data.minimum_stock = minimum_stock;
    if (maximum_stock !== undefined) data.maximum_stock = maximum_stock;
    if (location !== undefined) data.location = location;
    if (supplier !== undefined) data.supplier = supplier;
    if (is_active !== undefined) data.is_active = is_active;

    const result = await prisma.part.updateMany({
      where: {
        id: partId,
        organization_id: organizationId,
      },
      data,
    });

    if (result.count === 0) {
      return sendError(
        res,
        {},
        "Part not found or does not belong to your organization",
        CODES.NOT_FOUND
      );
    }

    const updatedPart = await prisma.part.findUnique({
      where: { id: partId },
    });

    return sendSuccess(
      res,
      { part: serializePart(updatedPart) },
      "Part updated successfully"
    );
  } catch (err) {
    return sendError(res, err, "Failed to update part", CODES.SERVER_ERROR);
  }
};

partController.createPart = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const {
      part_number,
      name,
      description,
      category,
      brand,
      unit_cost,
      retail_price,
      quantity_on_hand = 0,
      minimum_stock = 0,
      maximum_stock,
      location,
      supplier,
      is_active = true,
    } = req.body;

    if (!part_number || !name) {
      return sendError(
        res,
        {},
        "Part number and name are required",
        CODES.BAD_REQUEST
      );
    }

    if (quantity_on_hand < 0) {
      return sendError(
        res,
        {},
        "Quantity on hand cannot be less than 0",
        CODES.BAD_REQUEST
      );
    }

    if (minimum_stock < 0) {
      return sendError(
        res,
        {},
        "Minimum stock cannot be less than 0",
        CODES.BAD_REQUEST
      );
    }

    if (maximum_stock !== undefined && maximum_stock < 0) {
      return sendError(
        res,
        {},
        "Maximum stock cannot be less than 0",
        CODES.BAD_REQUEST
      );
    }

    // prevent duplicate part_number per organization
    const existingPart = await prisma.part.findFirst({
      where: {
        organization_id: organizationId,
        part_number,
      },
    });

    if (existingPart) {
      return sendError(
        res,
        {},
        "Part with this part number already exists",
        CODES.BAD_REQUEST
      );
    }

    const newPart = await prisma.part.create({
      data: {
        organization_id: organizationId,
        part_number,
        name,
        description,
        category,
        brand,
        unit_cost,
        retail_price,
        quantity_on_hand,
        minimum_stock,
        maximum_stock,
        location,
        supplier,
        is_active,
      },
    });

    return sendSuccess(
      res,
      { part: serializePart(newPart) },
      "Part created successfully",
      CODES.CREATED
    );
  } catch (err) {
    return sendError(res, err, "Failed to create part", CODES.SERVER_ERROR);
  }
};

partController.getInventoryAnalytics = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    if (!organizationId) {
      return sendError(res, {}, "Organization not found", CODES.BAD_REQUEST);
    }

    const parts = await prisma.part.findMany({
      where: {
        organization_id: organizationId,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        category: true,
        quantity_on_hand: true,
        minimum_stock: true,
        unit_cost: true,
        retail_price: true,
      },
    });

    const reorderAlerts = parts
      .filter((p) => Number(p.quantity_on_hand) <= Number(p.minimum_stock))
      .map((p) => ({
        id: p.id,
        name: p.name,
        quantity_left: Number(p.quantity_on_hand),
        minimum_stock: Number(p.minimum_stock),
      }));

    // -------- TOP CATEGORIES --------
    const categoryMap = {};

    parts.forEach((p) => {
      const cat = p.category || "Uncategorized";

      if (!categoryMap[cat]) {
        categoryMap[cat] = 0;
      }

      categoryMap[cat] += Number(p.quantity_on_hand);
    });

    const topCategories = Object.entries(categoryMap)
      .map(([category, units]) => ({ category, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    // -------- INVENTORY SUMMARY --------
    const totalSkus = parts.length;

    const totalUnits = parts.reduce(
      (sum, p) => sum + Number(p.quantity_on_hand),
      0
    );

    const avgUnitCost =
      totalSkus > 0
        ? parts.reduce((sum, p) => sum + Number(p.unit_cost || 0), 0) / totalSkus
        : 0;

    const avgMargin =
      totalSkus > 0
        ? parts.reduce((sum, p) => {
            const cost = Number(p.unit_cost || 0);
            const retail = Number(p.retail_price || 0);

            if (retail === 0) return sum;

            const margin = ((retail - cost) / retail) * 100;
            return sum + margin;
          }, 0) / totalSkus
        : 0;

    return sendSuccess(
      res,
      {
        reorderAlerts,
        topCategories,
        inventorySummary: {
          totalSkus,
          totalUnits,
          avgUnitCost: avgUnitCost.toFixed(2),
          avgMargin: avgMargin.toFixed(1),
        },
      },
      "Inventory analytics fetched successfully",
      CODES.OK
    );
  } catch (err) {
    return sendError(
      res,
      err,
      "Failed to fetch inventory analytics",
      CODES.SERVER_ERROR
    );
  }
};

module.exports = partController;

