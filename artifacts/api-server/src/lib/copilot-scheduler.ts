import cron from "node-cron";
import { logger } from "./logger";
import { generateTrendBrief, generatePerformanceReport } from "./copilot-generator";

export function startCopilotScheduler() {
  // 06:00 WIB = 23:00 UTC (WIB = UTC+7, so 06:00 - 7h = 23:00 previous day UTC)
  cron.schedule("0 23 * * *", async () => {
    logger.info("Cron: running morning trend brief (06:00 WIB)");
    try {
      await generateTrendBrief();
    } catch (err) {
      logger.error({ err }, "Trend brief cron job failed");
    }
  }, { timezone: "UTC" });

  // 16:00 WIB = 09:00 UTC
  cron.schedule("0 9 * * *", async () => {
    logger.info("Cron: running afternoon performance report (16:00 WIB)");
    try {
      await generatePerformanceReport();
    } catch (err) {
      logger.error({ err }, "Performance report cron job failed");
    }
  }, { timezone: "UTC" });

  logger.info("AdClaw Copilot scheduler started (trend brief 06:00 WIB, performance report 16:00 WIB)");
}
