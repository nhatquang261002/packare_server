require('dotenv').config();

const config = {
    db: {
        uri:process.env.DB_URI
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN
    },
    server: {
        port: process.env.SERVER_PORT,
        host: process.env.SERVER_HOST
    },
    session: {
        secret: process.env.SESSION_SECRET
    },
    goongToken: {
        goongToken: process.env.GOONG_TOKEN,
    }
};

module.exports = config;
