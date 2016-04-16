playerApp.directive('player', function ($timeout, $interval) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/vk-player/src/partials/player.html',
    scope: {
      props: '='
    },
    link: function (scope) {
      var interval = '';
      var intervalCutName = '';
      var allAudio = [];
      var audioList = [];

      scope.nextPlayStat = true;
      scope.auth = false;

      scope.curAudio = {
        name: '',
        author: '',
        src: '',
        duration: 0,
        cur_duration: 0,
        pause: true,
        stop: false,
        volume: 0.5,
        photo_author: '/vk-player/images/default_avatar.jpg',
        wrapper_author: '',
        style: ''
      };


      VK.Auth.getLoginStatus(function (response) {
        if (response.session) {
          scope.auth = true;
          getAudio();
        }
      });


      scope.logout = function () {
        scope.auth = false;
        scope.props = [];
        VK.Auth.logout();
      };

      scope.login = function () {
        VK.Auth.login(function (res) {
          if (res.session) {
            scope.auth = true;
            getAudio();
          }
        }, 65536 + 8);
      };

      scope.randomTrack = function () {
        scope.props = _.sortBy(scope.props, function (item) {
          return 0.5 * Math.random();
        })
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
            runningString(scope.curAudio.name);
            var sound = new Howl({
              urls: [firstEl.url],
              autoplay: true,
              volume: scope.curAudio.volume,
              onend: function () {
                scope.nextPlay(true)
              }
            });
            getArtistPhoto();
            interval = $interval(function () {
              scope.curAudio.cur_duration = Math.floor(sound.pos());
              setBkgCurPosition();
            }, 100);
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
        if (audioItem.url == scope.curAudio.src) {
          scope.pauseAndPlay();
          return false
        }
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
        getArtistPhoto();
        $interval.cancel(intervalCutName);
        runningString(scope.curAudio.name);
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
          setBkgCurPosition();
        }, 100);
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
        changeScrollPosition(indexSound);
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
        getArtistPhoto();
        interval = $interval(function () {
          scope.curAudio.cur_duration = Math.floor(sound.pos());
          setBkgCurPosition();
        }, 100);
        allAudio.push(sound);
        $timeout(function () {
          scope.nextPlayStat = true;
        }, 400);
        $interval.cancel(intervalCutName);
        runningString(scope.curAudio.name);
      };

      function setBkgCurPosition() {
        var duration = scope.curAudio.duration;
        var curDuration = scope.curAudio.cur_duration;
        var getProcent = 100 - (curDuration * 100) / duration;
        var curDeg = (174 + (getProcent)) + 'deg';
        scope.curAudio.style = 'background: linear-gradient(' + curDeg + ', #5d4c52 ' + getProcent + '%, #edb159 0);';
      }

      function stopAll() {
        _.each(allAudio, function (item) {
          item.stop();
          item.unload();
        });
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

      var rangeVolume = $("#rangeVolume");
      rangeVolume.rangeslider({
        polyfill: false,
        onInit: function () {
          $handle = $('.player-volume-character', this.$range);
        }
      });

      function changeScrollPosition(value) {
        var heightItem = 40;
        var defaultScrollItem = 4;
        var lengthAllAudio = scope.props.length;
        var valChange = heightItem * (value - defaultScrollItem);
        if (valChange < -(heightItem * defaultScrollItem)) {
          valChange = heightItem * lengthAllAudio
        } else if (valChange === (heightItem * lengthAllAudio) - (heightItem * defaultScrollItem)) {
          valChange = -160;
        }
        $(".nano").nanoScroller({ scrollTop: valChange });
      }

      function runningString(str) {
        var strLength = scope.curAudio.name.length;
        var cutName = scope.curAudio.name;
        scope.curAudio.name = scope.curAudio.name.trim();
        var curCut = 0;
        if (strLength <= 12) {
          return false;
        }
        intervalCutName = $interval(function () {
          if (scope.curAudio.name[0] === ' ' && _.last(scope.curAudio.name) !== ' ') {
            curCut++
          }
          curCut++;
          if (curCut === strLength) {
            curCut = 0;
            cutName = str;
          }
          scope.curAudio.name = str.substring(curCut, strLength);
        }, 300);
      }

      function init() {
        // Временно гавнокодим, т.к не знаю как отследить прием данных с вк.. Его эти VK функции ужс нет ни then, finally
        var nano = $(".nano");
        $interval(function () {
          nano.nanoScroller({sliderMaxHeight: 10});
          nano.nanoScroller();
        }, 100);
      }

      function getAudio() {
        VK.Api.call('audio.get', {}, function (res) {
          scope.props = res.response;
        });
        init();
      }

      function getArtistPhoto() {
        VK.Api.call('groups.search', {
          q: scope.curAudio.author,
          sort: 2,
          count: 50
        }, function (res) {
          var dataWithImage = _.filter(res.response, function (item) {
            return item.photo_big;
          }).filter(function (item) {
            return item.photo_big !== 'http://vk.com/images/community_200.png'
          });
          var firstRandom = _.first(_.sortBy(dataWithImage, function () {
            return 0.5 * Math.random();
          }));
          if (!firstRandom) {
            scope.curAudio.photo_author = '/vk-player/images/default_avatar.jpg';
            return false;
          }
          scope.curAudio.photo_author = firstRandom.photo_big;
        });
      }

    }
  };
});
