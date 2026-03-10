const prisma = require('../../../client/prismaClient')
const { sendSuccess, sendError } = require('../../../utils/responses')
const { CODES } = require('../../../utils/statusCodes')

const estimateController = {}

const ALLOWED_STATUSES = [
  'draft',
  'sent',
  'approved',
  'declined',
  'converted',
  'expired'
]

const serializeEstimate = est => ({
  id: est.id,
  estimate_number: est.estimate_number,
  number: est.number,
  status: est.status,
  service_type: est.service_type,
  description: est.description,
  priority: est.priority,
  notes: est.notes,
  total_amount: est.total_amount ? Number(est.total_amount).toFixed(2) : '0.00',
  estimated_completion: est.estimated_completion,
  valid_until: est.valid_until,
  converted_to_work_order_id: est.converted_to_work_order_id,
  organization_id: est.organization_id,
  created_at: est.created_at,
  updated_at: est.updated_at,
  customer: est.customer
    ? {
        id: est.customer.id,
        first_name: est.customer.first_name,
        last_name: est.customer.last_name,
        email: est.customer.email
      }
    : null,
  vehicle: est.vehicle
    ? {
        id: est.vehicle.id,
        year: est.vehicle.year,
        make: est.vehicle.make,
        model: est.vehicle.model,
        license_plate: est.vehicle.license_plate
      }
    : null
})

// GET /estimates?page=1&limit=10&status=draft&search=john&sortOrder=desc
estimateController.getAllEstimates = async (req, res) => {
  try {
    const organizationId = req.organizationId

    const {
      page = 1,
      limit = 10,
      status,
      search = '',
      sortOrder = 'desc'
    } = req.query

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const order = sortOrder === 'asc' ? 'asc' : 'desc'

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return sendError(
        res,
        {},
        `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
        CODES.BAD_REQUEST
      )
    }

    const where = { organization_id: organizationId }

    if (status) {
      where.status = status
    }

    // Search by customer name / email OR vehicle make / model / license_plate
    if (search.trim()) {
      where.OR = [
        { customer: { first_name: { contains: search, mode: 'insensitive' } } },
        { customer: { last_name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { vehicle: { make: { contains: search, mode: 'insensitive' } } },
        { vehicle: { model: { contains: search, mode: 'insensitive' } } },
        {
          vehicle: { license_plate: { contains: search, mode: 'insensitive' } }
        }
      ]
    }

    const include = {
      customer: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true
        }
      },
      vehicle: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          license_plate: true
        }
      }
    }

    const [estimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        orderBy: { created_at: order },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include
      }),
      prisma.estimate.count({ where })
    ])

    return sendSuccess(
      res,
      {
        estimates: estimates.map(serializeEstimate),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      },
      'Estimates fetched successfully'
    )
  } catch (err) {
    return sendError(res, err, 'Failed to fetch estimates', CODES.SERVER_ERROR)
  }
}

// GET /estimates/stats
estimateController.getEstimateStats = async (req, res) => {
  try {
    const organizationId = req.organizationId
    const now = new Date()

    const [total, draft, sent, approved, declined, converted, expired] =
      await Promise.all([
        prisma.estimate.count({ where: { organization_id: organizationId } }),
        prisma.estimate.count({
          where: { organization_id: organizationId, status: 'draft' }
        }),
        prisma.estimate.count({
          where: { organization_id: organizationId, status: 'sent' }
        }),
        prisma.estimate.count({
          where: { organization_id: organizationId, status: 'approved' }
        }),
        prisma.estimate.count({
          where: { organization_id: organizationId, status: 'declined' }
        }),
        prisma.estimate.count({
          where: { organization_id: organizationId, status: 'converted' }
        }),
        // Expired: valid_until is in the past and not yet converted/approved
        prisma.estimate.count({
          where: {
            organization_id: organizationId,
            valid_until: { lt: now },
            status: { notIn: ['sent', 'approved', 'declined', 'draft'] }
          }
        })
      ])

    return sendSuccess(
      res,
      { total, draft, sent, approved, declined, converted, expired },
      'Estimate stats fetched successfully'
    )
  } catch (err) {
    return sendError(
      res,
      err,
      'Failed to fetch estimate stats',
      CODES.SERVER_ERROR
    )
  }
}

module.exports = estimateController
