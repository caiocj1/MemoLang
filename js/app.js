$(document).ready(function () {
    $(window).on("hashchange", route);
    var my_url = "http://brochet.polytechnique.fr:60471";

    function route() {
        var hash = window.location.hash;
        switch (hash) {
            // Shows share list requests which the user can accept or refuse
            case "#notifications":
                var access_token = localStorage.getItem("access_token");
                $.getJSON(my_url + "/get_num_shares.php",
                    { access_token: access_token },
                    function (data) {
                        if (data > 0) {
                            $.get("template/menu/notifs.tpl.html", function (template) {
                                $.post(my_url + "/notifs.php",
                                    { access_token: access_token },
                                    function (data) {
                                        var content = Mustache.render(template, data);
                                        $("#my-content").html(content);

                                        $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                                            $("#menu").html(menu_template);
                                        }, "html");

                                        // When user accepts list, it is copied to his own
                                        $("#accept-list").click(function () {
                                            var list_code = sessionStorage.getItem("list_code");
                                            var share_code = sessionStorage.getItem("share_code");

                                            $.post(my_url + "/copy_list.php?list_code=" + list_code,
                                                { share_code: share_code, access_token: access_token },
                                                function (data) {
                                                    console.log(data);
                                                    alert(data.message == null ? data.error : data.message);
                                                    if (data.message != null)
                                                        location.href = "";
                                                });
                                        });

                                        $("#refuse-list").click(function () {
                                            var share_code = sessionStorage.getItem("share_code");

                                            $.post(my_url + "/refuse_notif.php",
                                                { share_code: share_code },
                                                function (data) {
                                                    console.log(data);
                                                    alert(data.message == null ? data.error : data.message);
                                                    if (data.message != null)
                                                        location.reload();
                                                });
                                        });
                                    });
                            }, "html");
                        }
                        else {
                            $.get("template/menu/no_notifs.tpl.html", function (template) {
                                $("#my-content").html(template);

                                $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                                    $("#menu").html(menu_template);
                                }, "html");
                            }, "html");
                        }
                    });
                break;

            // Shows user profile if user is logged in, redirects to login page if not
            case "#user":
                if (localStorage.getItem("access_token") == null) {
                    $.get("template/users/login.tpl.html", function (template) {
                        $("#my-content").html(template);
                        $("#connect").click(function () {
                            oAuthConnect()
                                .done(function (data) {
                                    if (data.access_token != null)
                                        localStorage.setItem("access_token", data.access_token);
                                    location.href = "";
                                })
                                .fail(function (xhr, status, error) {
                                    // ##### TODO : better error message
                                    var err = eval("(" + xhr.responseText + ")");
                                    alert("Could not connect");
                                });
                        });
                    }, "html");
                }
                else {
                    $.get("template/users/profile.tpl.html", function (template) {
                        $("#my-content").html(template);

                        $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                            $("#menu").html(menu_template);
                        }, "html");

                        $("#logout").click(function () {
                            localStorage.removeItem("access_token");
                            location.href = "";
                        });
                    }, "html");
                }
                break;

            // Register new user
            case "#register":
                $.get("template/users/register.tpl.html", function (template) {
                    $("#my-content").html(template);
                    $("#register").click(function () {
                        var register_username = $("#username").val();
                        var register_pwd = $("#pwd").val();
                        var register_pwd_confirm = $("#register-pwd-confirm").val();
                        var register_fst_name = $("#register-fst-name").val();
                        var register_lst_name = $("#register-lst-name").val();
                        var register_email = $("#register-email").val();

                        $.post(my_url + "/register.php",
                            {
                                username: register_username, pwd: register_pwd, conf: register_pwd_confirm,
                                first_name: register_fst_name, last_name: register_lst_name, email: register_email
                            },
                            function (data) {
                                console.log(data);
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null) {
                                    oAuthConnect()
                                        .done(function (data) {
                                            if (data.access_token != null)
                                                localStorage.setItem("access_token", data.access_token);
                                            location.href = "";
                                        });
                                }
                            });
                    });
                }, "html");
                break;

            // When button in main page ("index.tpl.html") is clicked, create new list
            case "#newlist":
                $.get("template/lists/new_list.tpl.html", function (template) {
                    $("#my-content").html(template);
                    $("#newlist").click(function () {
                        var list_title = $("#list-title").val();
                        var list_lang = $("#list-lang").val();
                        var list_desc = $("#list-desc").val();
                        var list_color = $("#list-color").val();
                        var access_token = localStorage.getItem("access_token");

                        $.post(my_url + "/new_list.php",
                            {
                                title: list_title, desc: list_desc,
                                lang: list_lang, color: list_color,
                                access_token: access_token
                            },
                            function (data) {
                                console.log(data);
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.href = "";
                            });
                    });
                }, "html");
                break;

            // When list is opened, its words are shown
            case "#inlist":
                var list_code = sessionStorage["list_code"];
                $.getJSON(my_url + "/get_list_info.php?list_code=" + list_code, function (data) {
                    // If list is empty
                    if (data.word_num == 0) {
                        $.get("template/lists/empty_list.tpl.html", function (template) {
                            $("#my-content").html(template);

                            $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                                $("#menu").html(menu_template);
                            }, "html");

                            // To add new word
                            $("#new-word").click(function () {
                                var original_word = $("#original-word").val();
                                var translation = $("#translation").val();
                                var description = $("#description").val();
                                var color = $("#color").val();
                                var access_token = localStorage.getItem("access_token");

                                $.post(my_url + "/new_word.php?list_code=" + list_code,
                                    {
                                        original_word: original_word, translation: translation,
                                        description: description, color: color,
                                        access_token: access_token
                                    },
                                    function (new_data) {
                                        console.log(new_data);
                                        alert(new_data.message == null ? new_data.error : new_data.message);
                                        location.reload();
                                    });
                            });
                        }, "html");
                    }
                    // If list is not empty
                    else {
                        $.get("template/lists/in_list.tpl.html", function (template) {
                            $.getJSON(my_url + "/in_list.php?list_code=" + list_code, function (new_data) {
                                var content = Mustache.render(template, new_data);
                                $("#my-content").html(content);
                                $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                                    $("#menu").html(menu_template);
                                }, "html");

                                // To add new word
                                $("#new-word").click(function () {
                                    var original_word = $("#original-word").val();
                                    var translation = $("#translation").val();
                                    var description = $("#description").val();
                                    var color = $("#color").val();
                                    var access_token = localStorage.getItem("access_token");

                                    $.post(my_url + "/new_word.php?list_code=" + list_code,
                                        {
                                            original_word: original_word, translation: translation,
                                            description: description, color: color,
                                            access_token: access_token
                                        },
                                        function (new_data) {
                                            console.log(new_data);
                                            alert(new_data.message == null ? new_data.error : new_data.message);
                                            location.reload();
                                        });
                                });

                                // To edit existing word
                                $("#edit-word").click(function () {
                                    var original_word = sessionStorage.getItem("original_word");
                                    var edited_word = $("#edit-original-word").val();
                                    var translation = $("#edit-translation").val();
                                    var description = $("#edit-description").val();
                                    var color = $("#edit-color").val();

                                    $.post(my_url + "/edit_word.php?list_code=" + list_code,
                                        {
                                            original_word: original_word,
                                            edited_word: edited_word,
                                            translation: translation,
                                            description: description,
                                            color: color
                                        },
                                        function (new_data) {
                                            console.log(new_data);
                                            alert(new_data.message == null ? new_data.error : new_data.message);
                                            location.reload();
                                        });
                                });

                                // To delete word
                                $("#delete-word").click(function () {
                                    var original_word = sessionStorage.getItem("original_word");

                                    $.post(my_url + "/delete_word.php?list_code=" + list_code,
                                        {
                                            original_word: original_word
                                        },
                                        function (new_data) {
                                            console.log(new_data);
                                            alert(new_data.message == null ? new_data.error : new_data.message);
                                            location.reload();
                                        });
                                });
                            })
                        }, "html");
                    }
                });
                break;

            // GAME - given a translation, write the foreign word in list
            case "#write_foreign":
                $.get("template/games/write_foreign.tpl.html", function (template) {
                    $("#my-content").html(template);

                    $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                        $("#menu").html(menu_template);
                    }, "html");

                    $("#check-answer").click(function () {
                        var word_code = sessionStorage.getItem("word_code");
                        var input = $("#write-foreign-ans").val();
                        $.post(my_url + "/wf_check.php?word_code=" + word_code,
                            { input: input },
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.reload();
                            });
                    });

                    $("#reset-btn").click(function () {
                        var list_code = sessionStorage.getItem("list_code");
                        $.post(my_url + "/reset_list_learned.php?list_code=" + list_code,
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.reload();
                            });
                    });
                }, "html");
                break;

            // GAME - given a word in the foreign language, write translation
            case "#write_translation":
                $.get("template/games/write_translation.tpl.html", function (template) {
                    $("#my-content").html(template);

                    $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                        $("#menu").html(menu_template);
                    }, "html");

                    $("#check-answer").click(function () {
                        var word_code = sessionStorage.getItem("word_code");
                        var input = $("#write-transl-ans").val();
                        $.post(my_url + "/wt_check.php?word_code=" + word_code,
                            { input: input },
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.reload();
                            });
                    });

                    $("#reset-btn").click(function () {
                        var list_code = sessionStorage.getItem("list_code");
                        $.post(my_url + "/reset_list_learned.php?list_code=" + list_code,
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.reload();
                            });
                    });
                }, "html");
                break;

            // GAME - select right definition among four options
            case "#select_def":
                $.get("template/games/select_def.tpl.html", function (template) {
                    $("#my-content").html(template);

                    $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                        $("#menu").html(menu_template);
                    }, "html");

                    $("#answer1").click(function () {
                        var word_code = sessionStorage.getItem("word_code");
                        var input = document.getElementById("answer1").innerHTML;

                        $.post(my_url + "/select_def_check.php?word_code=" + word_code,
                            { input: input },
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.reload();
                            });
                    });

                    $("#answer2").click(function () {
                        var word_code = sessionStorage.getItem("word_code");
                        var input = document.getElementById("answer2").innerHTML;

                        $.post(my_url + "/select_def_check.php?word_code=" + word_code,
                            { input: input },
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.reload();
                            });
                    });

                    $("#answer3").click(function () {
                        var word_code = sessionStorage.getItem("word_code");
                        var input = document.getElementById("answer3").innerHTML;

                        $.post(my_url + "/select_def_check.php?word_code=" + word_code,
                            { input: input },
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.reload();
                            });
                    });

                    $("#answer4").click(function () {
                        var word_code = sessionStorage.getItem("word_code");
                        var input = document.getElementById("answer4").innerHTML;

                        $.post(my_url + "/select_def_check.php?word_code=" + word_code,
                            { input: input },
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.reload();
                            });
                    });

                    $("#reset-btn").click(function () {
                        var list_code = sessionStorage.getItem("list_code");
                        $.post(my_url + "/reset_list_learned.php?list_code=" + list_code,
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.reload();
                            });
                    });
                }, "html");
                break;

            // GAME - reviews cards one by one
            case "#basic_review":
                $.get("template/games/basic_review.tpl.html", function (template) {
                    $("#my-content").html(template);

                    $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                        $("#menu").html(menu_template);
                    }, "html");

                    $("#easy-word").click(function () {
                        var word_code = sessionStorage.getItem("word_code");

                        $.post(my_url + "/basic_review.php?word_code=" + word_code,
                            { learned: 1 },
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                location.reload();
                            });
                    });

                    $("#hard-word").click(function () {
                        var word_code = sessionStorage.getItem("word_code");

                        $.post(my_url + "/basic_review.php?word_code=" + word_code,
                            { learned: 0 },
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                location.reload();
                            });
                    });

                    $("#reset-btn").click(function () {
                        var list_code = sessionStorage.getItem("list_code");
                        $.post(my_url + "/reset_list_learned.php?list_code=" + list_code,
                            function (data) {
                                alert(data.message == null ? data.error : data.message);
                                if (data.message != null)
                                    location.reload();
                            });
                    });
                }, "html");
                break;

            // Shows main page. Demands to login if user not connected.
            // Shows lists created by user otherwise, or "no lists" message if none have been created.
            default:
                if (localStorage.getItem("access_token") == null) {
                    $.get("template/users/not_logged.tpl.html", function (template) {
                        $("#my-content").html(template);
                    }, "html");
                }
                else {
                    var access_token = localStorage.getItem("access_token");
                    $.getJSON(my_url + "/get_num_lists.php",
                        { access_token: access_token },
                        function (data) {
                            if (data > 0) {
                                $.get("template/index.tpl.html", function (template) {
                                    $.post(my_url + "/lists.php",
                                        { access_token: access_token },
                                        function (data) {
                                            var content = Mustache.render(template, data);
                                            $("#my-content").html(content);

                                            $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                                                $("#menu").html(menu_template);
                                            }, "html");

                                            // To edit list
                                            $("#edit-list").click(function () {
                                                var list_code = sessionStorage["list_code"];
                                                var edited_title = $("#edit-list-title").val();
                                                var description = $("#edit-list-description").val();
                                                var language = $("#edit-list-lang").val();
                                                var color = $("#edit-list-color").val();

                                                $.post(my_url + "/edit_list.php?list_code=" + list_code,
                                                    {
                                                        edited_title: edited_title,
                                                        description: description,
                                                        language: language,
                                                        color: color
                                                    },
                                                    function (data) {
                                                        console.log(data);
                                                        alert(data.message == null ? data.error : data.message);
                                                        location.href = "";
                                                    });
                                            });

                                            // To delete list
                                            $("#delete-list").click(function () {
                                                var list_code = sessionStorage["list_code"];
                                                $.post(my_url + "/delete_list.php?list_code=" + list_code,
                                                    {},
                                                    function (data) {
                                                        console.log(data);
                                                        alert(data.message == null ? data.error : data.message);
                                                        location.href = "";
                                                    });
                                            });

                                            $("#share-list").click(function () {
                                                var target = $("#target-user").val();
                                                var access_token = localStorage.getItem("access_token");
                                                var list_code = sessionStorage["list_code"];

                                                $.post(my_url + "/send_notif.php?list_code=" + list_code,
                                                    {
                                                        target: target,
                                                        access_token: access_token
                                                    },
                                                    function (data) {
                                                        console.log(data);
                                                        alert(data.message == null ? data.error : data.message);
                                                        location.href = "";
                                                    });
                                            });

                                            $("#select-def-game").click(function () {
                                                var list_code = sessionStorage["list_code"];
                                                $.getJSON(my_url + "/get_list_info.php?list_code=" + list_code,
                                                    function (data) {
                                                        if (data.word_num < 4) {
                                                            alert("Insufficient number of words in list to play this game (min 4).");
                                                        }
                                                        else {
                                                            location.href += "#select_def";
                                                            location.reload();
                                                        }
                                                    });
                                            });
                                        });
                                }, "html");
                            }
                            else {
                                $.get("template/lists/no_lists.tpl.html", function (template) {
                                    $("#my-content").html(template);

                                    $.get("template/menu/menu_dropdown.tpl.html", function (menu_template) {
                                        $("#menu").html(menu_template);
                                    }, "html");
                                }, "html");
                            }
                        });
                }
                break;
        }
    }

    route();
});

