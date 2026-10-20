const { PrismaService } = require('../common/prisma.service');
const { applyController, applyMethods, declareDeps } = require('../common/apply');
const { Public } = require('../common/decorators/public.decorator');

class HealthController {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async check() {
    let db = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      db = false;
    }
    return { status: 'ok', db };
  }
}

declareDeps(HealthController, PrismaService);
applyController(HealthController, 'health');
applyMethods(HealthController, [
  { method: 'get', path: '', name: 'check', decorators: [Public()], params: [] },
]);

module.exports = { HealthController };
