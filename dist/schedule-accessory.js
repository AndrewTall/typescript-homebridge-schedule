"use strict";
const typescript_helper_functions_1 = require("typescript-helper-functions");
const cron_1 = require("cron");
let hap;
class ScheduleAccessory {
    log;
    name;
    serial;
    scheduleOn = false;
    enabledDuration;
    switchService;
    informationService;
    objectOperations;
    constructor(log, config) {
        this.objectOperations = new typescript_helper_functions_1.ObjectOperations();
        this.log = log;
        this.name = config.name;
        this.serial = (config.serial ?? '123456789').trim();
        this.enabledDuration = (config.enabledDuration ?? 1) * 1000;
        log.debug(`Name: [${config.name}]`);
        log.debug(`Interval: [${config.interval}]`);
        log.debug(`Cron: [${config.cron}]`);
        log.debug(`Serial: [${config.serial}]`);
        log.debug(`Enabled Duration: [${config.enabledDuration}]`);
        let intervalSupplied = true;
        if (config.interval === undefined) {
            intervalSupplied = false;
        }
        log.debug(`Interval param supplied: [${intervalSupplied}]`);
        const cronSupplied = !this.objectOperations.IsNullOrWhitespace(config.cron);
        log.debug(`Cron param supplied: [${cronSupplied}]`);
        if (!intervalSupplied && !cronSupplied) {
            log.error('Must supply either interval or cron');
        }
        else if (intervalSupplied && cronSupplied) {
            log.error('Cannot have both interval and cron. Choose one or the other');
        }
        log.info(`Creating schedule accessory [${config.name}]`);
        this.switchService = new hap.Service.Switch(this.name);
        this.switchService
            .getCharacteristic(hap.Characteristic.On)
            .on("get", (callback) => {
            this.log.debug(`Schedule: [${this.scheduleOn ? 'ON' : 'OFF'}]`);
            callback(undefined, this.scheduleOn);
        })
            .on("set", (value, callback) => {
            this.scheduleOn = value;
            if (value) {
                setTimeout(() => {
                    this.switchService.setCharacteristic('On', false);
                }, this.enabledDuration);
            }
            callback();
        });
        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, 'Homebridge Schedule')
            .setCharacteristic(hap.Characteristic.SerialNumber, this.serial)
            .setCharacteristic(hap.Characteristic.Model, config.interval);
        log.info('Initialization complete');
        if (intervalSupplied && !cronSupplied) {
            log.info(`Starting [${config.interval}] minute interval`);
            setInterval(() => {
                this.switchService.setCharacteristic('On', true);
            }, config.interval * 60000);
        }
        else if (!intervalSupplied && cronSupplied) {
            log.info(`Starting [${config.cron}] cron job`);
            const job = new cron_1.CronJob(config.cron, () => {
                this.switchService.setCharacteristic('On', true);
            });
            job.start();
        }
        else {
            log.error('Nothing started - check config');
        }
    }
    getServices() {
        return [this.informationService, this.switchService];
    }
}
module.exports = (api) => {
    hap = api.hap;
    api.registerAccessory('homebridge-schedule', 'Schedule', ScheduleAccessory);
};
//# sourceMappingURL=schedule-accessory.js.map