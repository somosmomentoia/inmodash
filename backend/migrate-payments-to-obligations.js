/**
 * Migration Script: Payment → Obligation
 * 
 * Migra todos los Payment existentes a Obligation con type='rent'
 * Si Payment.status='paid', crea también un ObligationPayment
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Iniciando migración de Payment → Obligation\n');

  try {
    // 1. Obtener todos los pagos
    const payments = await prisma.payment.findMany({
      include: {
        contract: {
          include: {
            apartment: true,
            tenant: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`📊 Total de pagos a migrar: ${payments.length}\n`);

    let migratedCount = 0;
    let paymentsCreatedCount = 0;
    let errors = [];

    // 2. Migrar cada pago
    for (const payment of payments) {
      try {
        // Normalizar período al primer día del mes
        const period = new Date(payment.month);
        period.setDate(1);

        // Calcular status de la obligación
        let obligationStatus = 'pending';
        let paidAmount = 0;

        if (payment.status === 'paid') {
          obligationStatus = 'paid';
          paidAmount = payment.amount;
        } else if (payment.status === 'overdue') {
          obligationStatus = 'overdue';
        }

        // Crear descripción
        const tenant = payment.contract?.tenant;
        const apartment = payment.contract?.apartment;
        const description = `Alquiler - ${apartment?.nomenclature || 'Propiedad'} - ${tenant?.nameOrBusiness || 'Inquilino'}`;

        // Crear obligación
        const obligation = await prisma.obligation.create({
          data: {
            userId: payment.userId,
            contractId: payment.contractId,
            apartmentId: payment.contract?.apartmentId,
            type: 'rent',
            description,
            period,
            dueDate: payment.month, // Usar el mes como fecha de vencimiento
            amount: payment.amount,
            paidAmount,
            commissionAmount: payment.commissionAmount,
            ownerAmount: payment.ownerAmount,
            status: obligationStatus,
            notes: payment.notes
          }
        });

        migratedCount++;
        console.log(`✅ Migrado Payment #${payment.id} → Obligation #${obligation.id}`);

        // Si el pago estaba marcado como pagado, crear ObligationPayment
        if (payment.status === 'paid' && payment.paymentDate) {
          const obligationPayment = await prisma.obligationPayment.create({
            data: {
              userId: payment.userId,
              obligationId: obligation.id,
              amount: payment.amount,
              paymentDate: payment.paymentDate,
              method: 'transfer', // Método por defecto
              notes: `Migrado desde Payment #${payment.id}`
            }
          });

          paymentsCreatedCount++;
          console.log(`   💰 Creado ObligationPayment #${obligationPayment.id}`);
        }

      } catch (error) {
        console.error(`❌ Error migrando Payment #${payment.id}:`, error.message);
        errors.push({
          paymentId: payment.id,
          error: error.message
        });
      }
    }

    // 3. Resumen
    console.log('\n═══════════════════════════════════════');
    console.log('📈 RESUMEN DE MIGRACIÓN');
    console.log('═══════════════════════════════════════');
    console.log(`Total pagos procesados: ${payments.length}`);
    console.log(`✅ Obligaciones creadas: ${migratedCount}`);
    console.log(`💰 Pagos reales creados: ${paymentsCreatedCount}`);
    console.log(`❌ Errores: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errores encontrados:');
      errors.forEach(err => {
        console.log(`   - Payment #${err.paymentId}: ${err.error}`);
      });
    }

    // 4. Verificación
    console.log('\n═══════════════════════════════════════');
    console.log('🔍 VERIFICACIÓN');
    console.log('═══════════════════════════════════════');

    const obligationsCount = await prisma.obligation.count();
    const obligationPaymentsCount = await prisma.obligationPayment.count();

    console.log(`Total Obligations en DB: ${obligationsCount}`);
    console.log(`Total ObligationPayments en DB: ${obligationPaymentsCount}`);

    // Estadísticas por estado
    const stats = await prisma.obligation.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    console.log('\nObligaciones por estado:');
    stats.forEach(stat => {
      console.log(`  - ${stat.status}: ${stat._count.status}`);
    });

    console.log('\n✅ Migración completada exitosamente!');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Los Payment originales NO fueron eliminados (LEGACY)');
    console.log('   - Puedes verificar los datos con Prisma Studio');
    console.log('   - El sistema ahora usará Obligation para nuevas operaciones');

  } catch (error) {
    console.error('\n❌ Error fatal en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrate()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
