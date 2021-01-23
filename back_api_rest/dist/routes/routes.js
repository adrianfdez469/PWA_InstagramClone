"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = require("../controllers/controller");
const router = express_1.default.Router();
router.get('/posts', controller_1.getPosts);
router.post('/posts', controller_1.addPost);
router.post('/subscription', controller_1.createSubscription);
exports.default = router;
