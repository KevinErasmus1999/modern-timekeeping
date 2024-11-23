import { User } from '../../entities/User';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                role: string;
            }
        }
    }
}

export {};