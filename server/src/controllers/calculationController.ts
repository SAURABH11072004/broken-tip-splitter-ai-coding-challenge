import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import {
  calculateSplit,
  splitInputSchema,
  splitCentsInputSchema,
  dollarsToCents,
  generateRemainderExplanation,
} from '@broken-tip-splitter/shared';

// Helper to parse either dollars or cents input
function parseCalculationInput(body: unknown) {
  const bodyObj = body as Record<string, unknown>;

  if (bodyObj && typeof bodyObj.billCents !== 'undefined') {
    const parsed = splitCentsInputSchema.parse(body);
    return {
      billCents: parsed.billCents,
      tipPercentage: parsed.tipPercentage,
      peopleCount: parsed.peopleCount,
    };
  }

  const parsed = splitInputSchema.parse(body);
  return {
    billCents: dollarsToCents(parsed.billAmount),
    tipPercentage: parsed.tipPercentage,
    peopleCount: parsed.peopleCount,
  };
}

export async function createCalculation(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseCalculationInput(req.body);
    const calculated = calculateSplit(input);

    const record = await prisma.splitCalculation.create({
      data: {
        billCents: calculated.billCents,
        tipPercentage: calculated.tipPercentage,
        tipCents: calculated.tipCents,
        grandTotalCents: calculated.grandTotalCents,
        peopleCount: calculated.peopleCount,
        baseShareCents: calculated.baseShareCents,
        remainderCents: calculated.remainderCents,
        shares: {
          create: calculated.shares.map((s) => ({
            personNumber: s.personNumber,
            baseShareCents: s.baseShareCents,
            extraCents: s.extraCents,
            finalShareCents: s.finalShareCents,
          })),
        },
      },
      include: {
        shares: {
          orderBy: { personNumber: 'asc' },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: record.id,
        billCents: record.billCents,
        tipPercentage: record.tipPercentage,
        tipCents: record.tipCents,
        grandTotalCents: record.grandTotalCents,
        peopleCount: record.peopleCount,
        baseShareCents: record.baseShareCents,
        remainderCents: record.remainderCents,
        remainderExplanation: generateRemainderExplanation(record.remainderCents),
        shares: record.shares,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCalculations(_req: Request, res: Response, next: NextFunction) {
  try {
    const records = await prisma.splitCalculation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        shares: {
          orderBy: { personNumber: 'asc' },
        },
      },
    });

    const data = records.map((rec) => ({
      id: rec.id,
      billCents: rec.billCents,
      tipPercentage: rec.tipPercentage,
      tipCents: rec.tipCents,
      grandTotalCents: rec.grandTotalCents,
      peopleCount: rec.peopleCount,
      baseShareCents: rec.baseShareCents,
      remainderCents: rec.remainderCents,
      remainderExplanation: generateRemainderExplanation(rec.remainderCents),
      shares: rec.shares,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCalculationById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const record = await prisma.splitCalculation.findUnique({
      where: { id },
      include: {
        shares: {
          orderBy: { personNumber: 'asc' },
        },
      },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Calculation with ID "${id}" was not found.`,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: record.id,
        billCents: record.billCents,
        tipPercentage: record.tipPercentage,
        tipCents: record.tipCents,
        grandTotalCents: record.grandTotalCents,
        peopleCount: record.peopleCount,
        baseShareCents: record.baseShareCents,
        remainderCents: record.remainderCents,
        remainderExplanation: generateRemainderExplanation(record.remainderCents),
        shares: record.shares,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateCalculation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const existing = await prisma.splitCalculation.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Calculation with ID "${id}" was not found.`,
        },
      });
    }

    const input = parseCalculationInput(req.body);
    const calculated = calculateSplit(input);

    const updated = await prisma.$transaction(async (tx) => {
      // Delete existing shares
      await tx.splitShare.deleteMany({
        where: { calculationId: id },
      });

      // Update calculation & create new shares
      return tx.splitCalculation.update({
        where: { id },
        data: {
          billCents: calculated.billCents,
          tipPercentage: calculated.tipPercentage,
          tipCents: calculated.tipCents,
          grandTotalCents: calculated.grandTotalCents,
          peopleCount: calculated.peopleCount,
          baseShareCents: calculated.baseShareCents,
          remainderCents: calculated.remainderCents,
          shares: {
            create: calculated.shares.map((s) => ({
              personNumber: s.personNumber,
              baseShareCents: s.baseShareCents,
              extraCents: s.extraCents,
              finalShareCents: s.finalShareCents,
            })),
          },
        },
        include: {
          shares: {
            orderBy: { personNumber: 'asc' },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        billCents: updated.billCents,
        tipPercentage: updated.tipPercentage,
        tipCents: updated.tipCents,
        grandTotalCents: updated.grandTotalCents,
        peopleCount: updated.peopleCount,
        baseShareCents: updated.baseShareCents,
        remainderCents: updated.remainderCents,
        remainderExplanation: generateRemainderExplanation(updated.remainderCents),
        shares: updated.shares,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteCalculation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const existing = await prisma.splitCalculation.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Calculation with ID "${id}" was not found.`,
        },
      });
    }

    await prisma.splitCalculation.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      data: {
        id,
        message: 'Calculation deleted successfully.',
      },
    });
  } catch (error) {
    return next(error);
  }
}
