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


function FullPageController($scope, $timeout, $location, $log, $rootScope, $route, $routeParams) {


  var allChatsRef = new Firebase("https://blabber.firebaseio.com/chats");
  var chatRef = null;
  var messagesRef = null;
  var lastMessagesQuery = null;


  $scope.my = {room_name: '', screen_name: ''};

  // Use location as our storage of current room_name
  $rootScope.$on("$locationChangeSuccess", function (event, location) {
    $log.info("location changed to:" + location);
    $timeout(function () {
      refreshChatRoom($routeParams.room_name);
    });
  });

  function refreshChatRoom(room_name) {
    if ($scope.my.screen_name) {
      if (room_name) {
        $scope.my.room_name = room_name;
      }
      else {
        // Log out of room_name
        $scope.my.room_name = '';
      }
    }

    $log.info('Current chat: as(' + $scope.my.screen_name + ") in(" + $scope.my.room_name + ")");
    return true;
  }

  $scope.$watch("my.room_name", function (newValue, oldValue) {
    if (newValue) {
      console.log(newValue);
      chatRef = allChatsRef.child(newValue);
      messagesRef = chatRef.child('messages');
      lastMessagesQuery = messagesRef.endAt().limit(10);

      $scope.chat = {
        room_name: newValue,
        started_by: $scope.my.screen_name,
        messages: []
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
    $scope.my.screen_name = $scope.my.pending_screen_name;
  };

  $scope.exit_screen_name = function () {
    $scope.my.screen_name = null;
    $scope.my.room_name = null;
    $location.path('/');
  };

  $scope.change_room_name = function () {
    $location.path('/in/' + $scope.my.pending_room_name);
  };

  $scope.exit_room_name = function () {
    $scope.my.room_name = null;
    $scope.my.pending_room_name = null;
    $location.path('/');
  };


  $scope.blab = function () {

    console.log($routeParams);


    var message = $scope.my.pending_message;
    var screen_name = $scope.my.screen_name;

    if (messagesRef && message && screen_name) {

      messagesRef.push(
        {
          screen_name: screen_name,
          content: message
        }
      );
      $scope.my.pending_message = '';
    }
  };


}

