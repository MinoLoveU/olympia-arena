import * as questionBank from '../../multiplayer/archive-bank.js';
import {createRoom as room} from '../../multiplayer/game.js';
import {createGameServer as server} from '../../server.js';
export * from '../../multiplayer/game.js';
export const createRoom=(options={})=>room({questionBank,...options});
export const createGameServer=(options={})=>server({questionBank,...options});
