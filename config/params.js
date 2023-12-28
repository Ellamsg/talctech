require('dotenv').config()

module.exports = {
    LOCAL_PORT: 3000,
    NODE_ENV: "production",
    SESSION_NAME: "talctech2020",
    SESSION_SECRET: "talctechDFFKFKFKFKsGHHolutions2020ddffgggkg",
    APP_NAME: "Talctech",
    TENANT_PLAN_CODE: process.env.TENANT_PLAN_CODE,
    RENTER_PLAN_CODE: process.env.RENTER_PLAN_CODE,
    LANDLORD_PLAN_CODE: process.env.LANDLORD_PLAN_CODE,
    EXECUTIVE_PLAN_CODE: process.env.EXECUTIVE_PLAN_CODE,
    TENANT_FEE: process.env.TENANT_FEE,
    PROPERTY_FEE: process.env.PROPERTY_FEE,
    LANDLORD_FEE: process.env.LANDLORD_FEE,
    EXECUTIVE_FEE: process.env.EXECUTIVE_FEE,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_USERNAME: process.env.EMAIL_USERNAME,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_PORT : process.env.EMAIL_PORT,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SECRET_KEY: process.env.SECRET_KEY,
    PUBLIC_KEY: process.env.PUBLIC_KEY,
}