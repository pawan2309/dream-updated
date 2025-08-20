import { NextApiRequest, NextApiResponse } from 'next';
import CronScheduler from '../../../lib/services/cronScheduler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const scheduler = CronScheduler.getInstance();

  switch (req.method) {
    case 'POST':
      try {
        const { action } = req.body;

        switch (action) {
          case 'start':
            scheduler.start();
            res.status(200).json({
              success: true,
              message: 'Cron scheduler started successfully',
              status: scheduler.getStatus()
            });
            break;

          case 'stop':
            scheduler.stop();
            res.status(200).json({
              success: true,
              message: 'Cron scheduler stopped successfully',
              status: scheduler.getStatus()
            });
            break;

          case 'sync':
            await scheduler.manualSync();
            res.status(200).json({
              success: true,
              message: 'Manual sync completed successfully',
              status: scheduler.getStatus()
            });
            break;

          default:
            res.status(400).json({
              success: false,
              error: 'Invalid action. Use: start, stop, or sync'
            });
        }
      } catch (error) {
        console.error('❌ Cron control error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to control cron scheduler',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      break;

    case 'GET':
      try {
        const status = scheduler.getStatus();
        res.status(200).json({
          success: true,
          status,
          message: status.isRunning 
            ? 'Cron scheduler is running' 
            : 'Cron scheduler is stopped'
        });
      } catch (error) {
        console.error('❌ Cron status error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get cron status',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
