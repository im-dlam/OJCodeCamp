
export interface LoginForm {
    username: string;
    password: string
}

export interface SignupForm extends LoginForm {
    email: string;
    full_name: string
}

export interface UserPublic {
    id: number
    username: string 
    email: string
    point: number 
    full_name: string
    role: string
    created_at: string
    updated_at: string
}

export interface UserLeaderBoard {
    username: string;
    full_name: string
    point: number;
}

export interface UserLeaderBoardRetult {
    success: boolean;
    leaderboard: UserLeaderBoard[];
    limit: number;
    message?: string
}