var url = "https://wind-bow.glitch.me/twitch-api";
var users = ["ogamingsc2", "cretetion", "freecodecamp", "storbeck", "robotcaleb", "streamerhouse"];
var userData = [];


/*** check if there is a cookie for the "users" array ***/

var checkCookie = function() {
  var cookie = getCookie("users");
  if (cookie !== "") {
    users = JSON.parse(cookie);
  }
  getUserData(users);
};

var getCookie = function(cName) {
  var name = cName + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
};


/*** get the user data from Twitch and add it to the "userData" array ***/

var getUserData = function(array) {
  var promises = [];
  for (var i = 0; i < array.length; i++) {
    promises.push(returnPromise(array, i));
  }
  Promise.all(promises)
    .then(function(result) {
      for (var j = 0; j < result.length; j++) {
        userData.push(result[j]);
      }
      $("#txt-loading-profiles").css("display", "none");
      sortByName();
      appendUserData();
    });
};

var returnPromise = function(array, i) {
  return getJSON(array, i, "/streams/").then(function(result) {
    if (result.hasOwnProperty("error")) {
      $("#txt-loading-profiles").css("display", "none");
      $("#txt-loading-error").css("display", "block");
    } else if (result.stream !== null) {
      return result;
    } else {
      return getJSON(array, i, "/channels/");
    }
  });
};

var getJSON = function(user, i, route) {
  return new Promise(function(resolve, reject) {
    var xhttp = [];
    xhttp[i] = new XMLHttpRequest();
    xhttp[i].open("GET", url + route + user[i], true);
    xhttp[i].onreadystatechange = function() {
      if (xhttp[i].readyState === 4 && xhttp[i].status === 200) {
        var result = JSON.parse(xhttp[i].responseText);
        result.name = user[i];
        resolve(result);
      }
    };
    xhttp[i].send();
  });
};


/*** sort the "userData" array by name ***/

var sortByName = function() {
  if ($("#btn-sort-names").text() === "A - Z") {
    userData.sort(sortByProperty("name"));
  } else {
    userData.sort(sortByProperty("name")).reverse();
  }
};

var sortByProperty = function(string) {
  return function(a, b) {
    var stringA = a[string].toUpperCase();
    var stringB = b[string].toUpperCase();
    var comparison = 0;
    if (stringA > stringB) {
      comparison = 1;
    } else if (stringA < stringB) {
      comparison = -1;
    }
    return comparison;
  };
};


/*** insert the content and display the user data on page ***/

var appendUserData = function() {
  for (var i = 0; i < userData.length; i++) {
    if (userData[i].hasOwnProperty("stream")) {
      userOnline(userData, i);
    } else if (userData[i].hasOwnProperty("error")) {
      userNotFound(userData, i);
    } else {
      userOffline(userData, i);
    }
  }
  if ($("#btn-filter").text() === "Online") {
    $(".offline, .not-found").hide();
  } else if ($("#btn-filter").text() === "Offline") {
    $(".online").hide();
  }
  showLastUpdate();
};

var userOnline = function(user, i) {
  $("#profiles").append('<div class="online ' + user[i].name + '"></div>');
  userImage(user, i, user[i].stream.channel.logo);
  $("." + user[i].name).append('<div class="text info' + i + '"></div>');
  $("." + user[i].name).append('<a href="' + user[i].stream.channel.url + '" target="_blank"></a>');
  $("." + user[i].name).append('<div class="btn-delete">&times;</div>');
  $(".info" + i).append('<div class="username">' + user[i].stream.channel.display_name + "</div>");
  $(".info" + i).append('<div class="game">' + user[i].stream.game + "</div>");
  $(".info" + i).append('<div class="status">' + "Viewers: " + user[i].stream.viewers + "</div>");
};

var userOffline = function(user, i) {
  $("#profiles").append('<div class="offline ' + user[i].name + '"></div>');
  userImage(user, i, user[i].logo);
  $("." + user[i].name).append('<div class="text info' + i + '"></div>');
  $("." + user[i].name).append('<a href="' + user[i].url + '" target="_blank"></a>');
  $("." + user[i].name).append('<div class="btn-delete">&times;</div>');
  $(".info" + i).append('<div class="username">' + user[i].display_name + "</div>");
  $(".info" + i).append('<div class="status">Offline</div>');
};

var userNotFound = function(user, i) {
  $("#profiles").append('<div class="not-found ' + user[i].name + '"></div>');
  userImage(user, i, null);
  $("." + user[i].name).append('<div class="btn-delete">&times;</div>');
  $("." + user[i].name).append('<div class="text info' + i + '"></div>');
  $(".info" + i).append('<div class="username">' + user[i].name + "</div>");
  $(".info" + i).append('<div class="status">User not found</div>');
};

var userImage = function(user, i, image) {
  if (image === null) {
    $("." + user[i].name).append('<img src="img/twitch_user.png">');
  } else {
    $("." + user[i].name).append('<img src="' + image + '">');
  }
};

var showLastUpdate = function() {
  var time = new Date(Date.now());
  var hour = time.getHours();
  var minutes = time.getMinutes();
  if (minutes < 10) {
    var formatted = hour + ":" + "0" + minutes;
  } else {
    var formatted = hour + ":" + minutes;
  }
  $("#txt-last-update span").text(formatted);
};


/*** set a new cookie whenever a user has been added or removed ***/

var setCookie = function(cName, cValue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  var expires = "expires=" + d.toUTCString();
  document.cookie = cName + "=" + cValue + ";" + expires + ";path=/";
};


/*** all button related functions ***/

$("#btn-add-user").on("click", function() {
  addNewUser();
});

$("#input-add-user").keydown(function(e) {
 if (e.which == 13) {
    addNewUser();
  }
});

var addNewUser = function() {
  var name = $("#input-add-user").val().toLowerCase();
  if (users.indexOf(name) !== -1) {
    $("#error-already-added").css("display", "block");
  } else if (!/^[a-zA-Z0-9][a-zA-Z0-9_]*$/.test(name)) {
    $("#error-invalid-name").css("display", "block");
  } else {
    $(".online, .offline, .not-found").remove();
    $("#txt-loading-profiles").css("display", "block");
    users.push(name);
    getUserData([name]);
    setCookie("users", JSON.stringify(users), 30);
    $("#input-add-user").val("");
  }
};

$("#profiles").on("click", ".btn-delete", function() {
  var name = $(this).parent().attr('class').split(" ")[1];
  var usersIndex = users.indexOf(name);
  var userDataIndex = userData.findIndex(function(element) {
    return element.name === name;
  });
  users.splice(usersIndex, 1);
  userData.splice(userDataIndex, 1);
  setCookie("users", JSON.stringify(users), 30);
  $(this).parent().remove();
});

$("#btn-filter").on("click", function() {
  if ($(this).text() === "All") {
    $(".offline, .not-found").hide();
    $(this).text("Online");
  } else if ($(this).text() === "Online") {
    $(".online").hide();
    $(".offline, .not-found").show();
    $(this).text("Offline");
  } else {
    $(".online, .offline, .not-found").show();
    $(this).text("All");
  }
});

$("#btn-sort-names").on("click", function() {
  if ($("#btn-sort-names").text() === "A - Z") {
    $(this).text("Z - A");
  } else {
    $(this).text("A - Z");
  }
  $(".online, .offline, .not-found").remove();
  sortByName();
  appendUserData();
});

$("#btn-update").on("click", function() {
  $(".online, .offline, .not-found").remove();
  $("#txt-loading-error").css("display", "none");
  $("#txt-loading-profiles").css("display", "block");
  userData = [];
  getUserData(users);
});

$(".btn-close-error").on("click", function() {
  $("#error-already-added").css("display", "none");
  $("#error-invalid-name").css("display", "none");
});


/*** end ***/

checkCookie();