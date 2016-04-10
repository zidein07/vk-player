playerApp.directive('player', function ($timeout, $interval, $http) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/vk-player/src/partials/player.html',
    scope: {
      props: '='
    },
    link: function (scope) {
      var interval = '';
      var allAudio = [];
      var audioList = [];
      scope.nextPlayStat = true;
      scope.curAudio = {
        name: '',
        author: '',
        src: '',
        duration: 0,
        cur_duration: 0,
        pause: true,
        stop: false,
        volume: 0.5,
        photo_author: '',
        wrapper_author: ''
      };

      scope.pauseAndPlay = function () {
        scope.curAudio.pause = !scope.curAudio.pause;
        if (scope.curAudio.pause) {
          if (!_.isEmpty(allAudio)) {
            _.last(allAudio).pause().play;
          }
        } else {
          if (!_.isEmpty(allAudio)) {
            _.last(allAudio).play().play;
          } else {
            var firstEl = _.first(scope.props);
            addActiveClassItem(firstEl);
            var sound = new Howl({
              urls: [firstEl.url],
              autoplay: true,
              volume: scope.curAudio.volume,
              onend: function () {
                scope.nextPlay(true)
              }
            });
            interval = $interval(function () {
              scope.curAudio.cur_duration = Math.floor(sound.pos());
            }, 300);
            allAudio.push(sound);
          }
        }
      };

      scope.changeVolume = function () {
        if (!_.last(allAudio)) {
          return false;
        }
        _.last(allAudio).volume(scope.curAudio.volume).play;
      };

      scope.startAudio = function (audioItem) {
        scope.curAudio.pause = false;
        audioList = [audioItem.url];
        audioItem = addActiveClassItem(audioItem);
        if (!_.isEmpty(allAudio)) {
          stopAll();
          scope.curAudio.cur_duration = 0;
        }
        scope.curAudio.name = audioItem.title;
        scope.curAudio.author = audioItem.artist;
        scope.curAudio.duration = audioItem.duration;
        var sound = new Howl({
          urls: audioList,
          autoplay: true,
          volume: scope.curAudio.volume,
          onend: function () {
            scope.nextPlay(true)
          }
        });
        interval = $interval(function () {
          scope.curAudio.cur_duration = Math.floor(sound.pos());
        }, 300);
        allAudio.push(sound);
      };

      scope.nextPlay = function (status) {
        scope.curAudio.cur_duration = 0;
        if (!scope.nextPlayStat || _.isEmpty(allAudio)) {
          return false;
        }

        scope.nextPlayStat = false;
        scope.curAudio.pause = false;
        var curPlay = _.last(allAudio);
        var sizeProps = _.size(scope.props);
        var indexSound = 0;
        _.each(scope.props, function (item, index) {
          if (item.url === curPlay._src) {
            indexSound = index;
          }
        });
        if (status) {
          indexSound++;
        } else {
          indexSound--;
        }
        if (indexSound < 0) {
          indexSound = sizeProps - 1;
        } else if (indexSound > sizeProps - 1 && indexSound > 0) {
          indexSound = 0;
        }
        addActiveClassItem(scope.props[indexSound]);
        var sound = new Howl({
          urls: [scope.props[indexSound].url],
          autoplay: true,
          volume: scope.curAudio.volume,
          onend: function () {
            scope.nextPlay(true)
          }
        });
        interval = $interval(function () {
          scope.curAudio.cur_duration = Math.floor(sound.pos());
        }, 300);
        allAudio.push(sound);
        $timeout(function () {
          scope.nextPlayStat = true;
        }, 400);
      };

      function stopAll() {
        _.each(allAudio, function (item) {
          item.stop();
          item.unload();
        });
        //getAlbumPhoto();
        $interval.cancel(interval);
      }

      function addActiveClassItem(audioItem) {
        stopAll();
        scope.curAudio.name = audioItem.title;
        scope.curAudio.author = audioItem.artist;
        scope.curAudio.duration = audioItem.duration;
        scope.curAudio.src = audioItem.url;
        scope.props = _.map(scope.props, function (item) {
          item.active = false;
          return item
        });
        audioItem.active = true;
        return audioItem;
      }

      function getAlbumPhoto() {
        var dataLink = {
          req: 'http://ws.audioscrobbler.com/2.0/',
          method: ['?method=library.getartists'],
          api_key: '&api_key=a7c03fb6dc378100dfe254c7b20da564',
          name: scope.curAudio.author,
          page: '2',
          limit: 1
        };

        var url = dataLink.req
          + dataLink.method[0]
          + dataLink.api_key
          + '&user='
          + dataLink.name
          + '&page='
          + dataLink.page
          + '&limit='
          + dataLink.limit
          + '&format=json'
          + '&callback=JSON_CALLBACK';

        $http.jsonp(url).success(function (res) {
          console.log('res', res);
          //$scope.dataAudio = res.response;
        })
      }
    }
  };
});
