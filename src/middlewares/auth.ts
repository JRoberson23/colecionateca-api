import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
    userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }                       

        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
            id: string;
            email: string;
            role: string;
        };

        req.userId = decoded.id;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
}

// Admin
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    authMiddleware(req, res, (err) => {
        if (err) return next(err);

        if (req.userRole !== 'admin') {
            return res.status(403).json({ 
                message: 'Acesso negado. Apenas administradores podem realizar esta ação.' 
            });
        }

        next();
    });
}