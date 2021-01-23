"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes/routes"));
const path_1 = __importDefault(require("path"));
const app = express_1.default();
app.use(cors_1.default());
app.use('/public', express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(express_1.default.json());
app.use('/', routes_1.default);
app.use((err, req, resp, next) => {
    resp.status(500).json({ message: err.message });
});
app.listen(3000, () => {
    console.log('Server up in port 3000!!!');
});
