export const JWT_CONST = {
    secret: 'tynguyen',
    expired: '15m'
};

export const AUTH_MSG = {
    urlMsgAvailable : {
       registeredAccount: 'Your account has been registered, please check mail to verify account',
       forgotAccount: 'Check mail to change your password'
    },
    mailCheckMsg: {
        registeredAccount: 'Your account not verified, please check mail to verify account',
        forgotAccount: 'Your reset password account url has just been sent, please check mail'
    },
    accountNotRegistered: 'Account is not registered',
    accountNotVerified: 'Account is not verified',
    resendAccountVerify: 'User is not verified, sign up again to resend mail verification',
    urlExpired: 'Your link activation expired',
    accountVerifySuccess: 'Account verify successfully',
    accountVerified: 'Your account has been verified'
}

export const END_POINT = {
    resetPassword: '/auth/reset-password'
}