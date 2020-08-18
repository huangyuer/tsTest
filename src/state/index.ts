import Vue from 'vue';
import Common from './module/common';
import Activity from './module/activity';
import Ui from './module/ui';
import Gift from './module/gift';
import Raffle from './module/raffle';
import Workbench from './module/workbench';
import Poster from './module/poster';
export interface State {
    common: Common;
    activity: Activity;
    gift: Gift;
    raffle: Raffle;
    workbench: Workbench;
    ui: Ui;
    poster: Poster;
}

export const stateCommon: Common = new Common();
export const stateActivity: Activity = new Activity();
export const stateUi: Ui = new Ui();
export const stateGift: Gift = new Gift();
export const stateRaffle: Raffle = new Raffle();
export const stateWorkbench: Workbench = new Workbench();
export const statePoster: Poster = new Poster();

export const state: State = {
    common: stateCommon,
    activity: stateActivity,
    gift: stateGift,
    raffle: stateRaffle,
    workbench: stateWorkbench,
    ui: stateUi,
    poster: statePoster,
};

Vue.prototype.$state = state;
