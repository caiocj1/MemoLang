var url = "http://brochet.polytechnique.fr:60471";
var client_id = "memolangClient";
var client_mdp = "password";

function oAuthConnect() {
   // récupérez ici avec Jquery les valeurs contenus dans vos champs <input> du template de login
   var username = $("#username").val();
   var password = $("#pwd").val();

    return $.ajax({
        method: "post",
        url: url + "/token.php",
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        beforeSend: function (xhr) {
            // login + mdp pour se connecter à l'API
            xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ':' + client_mdp));
        },
        data: {
            grant_type: "password",
            // login + mdp LDAP / ENEX (pas besoin de les stocker)
            username: username,
            password: password
        }
    });
}