var BlabberApp = angular.module("BlabberApp", ['ngRoute']);


BlabberApp.directive('blabFocusWhenFalsy', function ($timeout, $rootScope) {
  return {
    restrict: 'A',
    scope: {
      checkValue: "=blabFocusWhenFalsy"
    },
    link: function ($scope, $element, attrs) {
      $scope.$watch("checkValue", function (currentValue, previousValue) {
        if (!currentValue) {
          $element[0].focus();
          $element[0].select();
        }
      })
    }
  }
});

BlabberApp.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider.
      when('/', {
      }).
      when('/in/:room_name', {
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);

BlabberApp.factory('userStateService', ['$rootScope', function ($rootScope) {

  var service = {

    model: {
      version: 1.0,
      screen_name: '',
      room_name: '',
      room_favourites: []
    },

    SaveState: function () {
      sessionStorage.userService = angular.toJson(service.model);
    },

    RestoreState: function () {
      service.model = angular.fromJson(sessionStorage.userService);
    }
  }

  $rootScope.$on("savestate", service.SaveState);
  $rootScope.$on("restorestate", service.RestoreState);

  return service;
}]);

function FullPageController($scope, $timeout, $location, $rootScope, $route, $routeParams) {

  var allChatsRef = new Firebase("https://blabber.firebaseio.com/chats");
  var chatRef = null;
  var messagesRef = null;
  var lastMessagesQuery = null;

  $scope.validScreenName = /^[-_A-Za-z\d]{2,30}$/;
  $scope.validRoomName = /^[-_A-Za-z\d]{4,32}$/;
  $scope.validBlabMessage = /^.{1,140}$/;

  $scope.my = {room_name: '', screen_name: ''};

  // Use location as our storage of current room_name
  $rootScope.$on("$locationChangeSuccess", function (event, location) {
    $timeout(function () {
      refreshChatRoom($routeParams.room_name);
    });
  });

  function refreshChatRoom(room_name) {
    if (room_name && room_name.match($scope.validRoomName)) {
      $scope.my.pending_room_name = $scope.my.room_name = room_name;
    }
    else {
      // Log out of room_name
      $scope.my.pending_room_name = $scope.my.room_name = '';
    }
    return true;
  }

  $scope.$watch("my.room_name", function (newRoomName, _) {
    if (newRoomName && newRoomName.match($scope.validRoomName)) {
      newRoomName = newRoomName.toLowerCase();
      chatRef = allChatsRef.child(newRoomName);
      messagesRef = chatRef.child('messages');
      lastMessagesQuery = messagesRef.endAt().limit(10);

      $scope.chat = {
        room_name: newRoomName,
        started_by: $scope.my.screen_name,
        messages: [],
        share: window.location.href
      };

      lastMessagesQuery.on('value', function (ss) {
        // Sometimes the query is updated on thread
        // So we'll use timeout to get an implied $apply
        $timeout(function () {
          var messages = [];
          // Reverse the order
          ss.forEach(function (childSnapshot) {
            messages.unshift(childSnapshot.val());
          });
          $scope.chat.messages = messages;
        });
      });
    }
    else {
      $scope.chat = {};
    }
  });

  $scope.change_screen_name = function () {
    if ($scope.my.pending_screen_name
      && $scope.my.pending_screen_name.match($scope.validScreenName)) {
      $scope.my.screen_name = $scope.my.pending_screen_name;
    }
  };

  $scope.exit_screen_name = function () {
    $scope.my.screen_name = null;
    $scope.my.room_name = null;
    $location.path('/');
  };

  $scope.change_room_name = function () {
    if ($scope.my.pending_room_name) {
      $scope.my.pending_room_name = $scope.my.pending_room_name.toLowerCase();
      if ($scope.my.pending_room_name.match($scope.validRoomName)) {
        $location.path('/in/' + $scope.my.pending_room_name);
      }
    }

  };

  $scope.exit_room_name = function () {
    $scope.my.room_name = null;
    $scope.my.pending_room_name = null;
    $location.path('/');
  };


  $scope.blab = function () {
    var message = $scope.my.pending_message;
    var screen_name = $scope.my.screen_name;

    if (screen_name
      && screen_name.match($scope.validScreenName)) {

      if (message
        && message.match($scope.validBlabMessage)) {
        if (messagesRef && message) {

          messagesRef.push(
            {
              screen_name: screen_name,
              content: message
            }
          );
          $scope.my.pending_message = '';
        }
      }
    }
  };


}

