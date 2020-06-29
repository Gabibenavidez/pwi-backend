function validarRegistro(username, password) {
    if(username.length<3 || password.length<4) {
        return false;
    }
    return true;
}

function validarLogin(username, password) {
    if(username.length<3 || password.length<4) {
        return false;
    }
    return true;
}


module.exports = {
    validarLogin,
    validarRegistro,
}