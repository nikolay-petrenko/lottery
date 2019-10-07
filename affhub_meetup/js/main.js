let loaded = !1;
! function () {
  document.getElementById("place"), Snap("#place");
  const pinkCircle = Snap.select(".pinkCircle"),
    pinkStar = Snap.select(".pinkStar"),
    pinkLine = Snap.select(".pinkLine"),
    pinkSquare = Snap.select(".pinkSquare"),
    pinkStarPoints = (pinkCircle.node.getAttribute("d"), pinkStar.node.getAttribute("d")),
    pinkLinePoints = pinkLine.node.getAttribute("d"),
    pinkSquarePoints = pinkSquare.node.getAttribute("d"),
    greenCircle = Snap.select(".greenCircle"),
    greenStar = Snap.select(".greenStar"),
    greenLine = Snap.select(".greenLine"),
    greenSquare = Snap.select(".greenSquare"),
    greenStarPoints = (greenCircle.node.getAttribute("d"), greenStar.node.getAttribute("d")),
    greenLinePoints = greenLine.node.getAttribute("d"),
    greenSquarePoints = greenSquare.node.getAttribute("d"),
    redCircle = Snap.select(".redCircle"),
    redStar = Snap.select(".redStar"),
    redLine = Snap.select(".redLine"),
    redSquare = Snap.select(".redSquare"),
    redStarPoints = (redCircle.node.getAttribute("d"), redStar.node.getAttribute("d")),
    redLinePoints = redLine.node.getAttribute("d"),
    redSquarePoints = redSquare.node.getAttribute("d"),
    blueCircle = Snap.select(".blueCircle"),
    blueStar = Snap.select(".blueStar"),
    blueLine = Snap.select(".blueLine"),
    blueSquare = Snap.select(".blueSquare"),
    blueStarPoints = (blueCircle.node.getAttribute("d"), blueStar.node.getAttribute("d")),
    blueLinePoints = blueLine.node.getAttribute("d"),
    blueSquarePoints = blueSquare.node.getAttribute("d"),
    orangeCircle = Snap.select(".orangeCircle"),
    orangeStar = Snap.select(".orangeStar"),
    orangeLine = Snap.select(".orangeLine"),
    orangeSquare = Snap.select(".orangeSquare"),
    orangeStarPoints = (orangeCircle.node.getAttribute("d"), orangeStar.node.getAttribute("d")),
    orangeLinePoints = orangeLine.node.getAttribute("d"),
    orangeSquarePoints = orangeSquare.node.getAttribute("d");
  var anim = function (target, points) {
    target.animate({
      d: points
    }, 400, mina.elastic())
  };

  function star() {
    if (!loaded) {
      anim(pinkCircle, pinkStarPoints);
      anim(greenCircle, greenStarPoints);
      anim(redCircle, redStarPoints);
      anim(blueCircle, blueStarPoints);
      anim(orangeCircle, orangeStarPoints);
      setTimeout(line, 500)
    }
  }

  function line() {
    if (!loaded) {
      anim(pinkCircle, pinkLinePoints);
      anim(greenCircle, greenLinePoints);
      anim(redCircle, redLinePoints);
      anim(blueCircle, blueLinePoints);
      anim(orangeCircle, orangeLinePoints);
      setTimeout(square, 500)
    }
  }

  function square() {
    if (!loaded) {
      anim(pinkCircle, pinkSquarePoints);
      anim(greenCircle, greenSquarePoints);
      anim(redCircle, redSquarePoints);
      anim(blueCircle, blueSquarePoints);
      anim(orangeCircle, orangeSquarePoints);
      setTimeout(star, 500)
    }
  }
  setTimeout(star, 100)
}();
window.onload = function () {
  let loader = document.querySelector(".loader");
  loaded = !0;
  loader.classList.add("hide");
  window.innerWidth >= 1023 && function () {
    const controller = new ScrollMagic.Controller;
    const myTimeLine = new TimelineMax();
    myTimeLine
      .staggerFromTo('.letter', 1, { x: -10, opacity: 0 }, { x: 0, opacity: 1 }, 0.1)
      .fromTo('.logo', 1, { x: -30, opacity: 0 }, { x: 0, opacity: 1 }, 0)
      .fromTo('.nav__item', 1, { y: -50, opacity: 0 }, { y: 0, opacity: 1 }, 0)
      .fromTo('.title', 1, { x: -150, opacity: 0 }, { x: 0, opacity: 1 }, 0)
      .fromTo('.top__ttl', 1, { y: -30, opacity: 0 }, { y: 0, opacity: 1 }, 0.2)
      .fromTo('.top__center .text', 1, { x: 50, opacity: 0 }, { x: 0, opacity: 1 }, 0.1)
      .fromTo('.js-day', 1, { x: -30, opacity: 0 }, { x: 0, opacity: 1 }, 0.3)
      .fromTo('.poster__day', 1, { x: 30, opacity: 0 }, { x: 0, opacity: 1 }, 0.1)
    const myTimeLineAbout = new TimelineMax();
    myTimeLineAbout
      .fromTo('.why__title', 1, { x: -30, opacity: 0 }, { x: 0, opacity: 1 }, 0)
    new ScrollMagic.Scene({
      triggerElement: ".why",
      reverse: !1
    }).setTween(myTimeLineAbout).addTo(controller);
    const myTimeLineSpeakers = new TimelineMax();
    myTimeLineSpeakers
      .staggerFromTo('.speaker', 1, { x: -10, opacity: 0 }, { x: 0, opacity: 1 }, 0.1)
    new ScrollMagic.Scene({
      triggerElement: ".speakers",
      reverse: !1
    }).setTween(myTimeLineSpeakers).addTo(controller);
    const myTimeLineTimeline = new TimelineMax();
    myTimeLineTimeline
      .staggerFromTo('.js-item', 1, { y: -10, opacity: 0 }, { y: 0, opacity: 1 }, 0.1)
    new ScrollMagic.Scene({
      triggerElement: ".timeline",
      reverse: !1
    }).setTween(myTimeLineTimeline).addTo(controller);
  }()
};

const App = (function () {
  "use strict";
  const burgerMenu = $(".js-burger"),
    navMenuMobile = $("#js-mobile-menu"),
    contentAll = $(".block"),
    DOC = $(document);
  let animationObj = {};
  const popupContent = $('.popup-meetup__content');


  return {
    burgerMenuShow: function () {
      burgerMenu.click(function (e) {
        e.preventDefault();
        const href = $(this).data("target");
        $(href).toggleClass("menu-mobile--active");
        burgerMenu.toggleClass("burger--active");
        contentAll.toggleClass("active");
        noScroll.toggle();
      });
    },
    scrollToTarget: function (scrollSelector, speed) {
      const links = $(scrollSelector);
      links.click(function (e) {

        e.preventDefault();
        const _this = $(this);
        noScroll.off();
        contentAll.removeClass("active");
        navMenuMobile.removeClass("menu-mobile--active");

        burgerMenu.removeClass("burger--active");
        links.removeClass("active");
        _this.addClass("active");
        const href = _this.attr("href");
        if (href.length <= 1) return;
        const target = $(href);
        if (!target.length) return;
        const top = target.offset().top;
        $("html, body").animate(
          {
            scrollTop: top - 40
          },
          speed
        );
      });
    },
    labelFormActive: function () {
      $(".js-input").keyup(function () {
        $(this).val()
          ? $(this).addClass("active")
          : $(this).removeClass("active");
      });
    },
    addFormSubmitEvent: () => {
      const thanksButton = document.getElementById("repeat-form");
      document.getElementById("registration_form").onsubmit = register;
      thanksButton.onclick = switchThanksMessage;
    },
    detectAnimationBlocks: function () {
      const blocks = $("[data-animated]");
      for (let i = 0; i < blocks.length; i++) {
        const block = $(blocks[i]);
        const key = block.data("animated");
        const value = parseInt(block.offset().top - $(window).height() / 1.5);
        animationObj[key] = {
          offset: value,
          animated: false
        };
      }
    },
    animateAboutBlock: function () {
      const height = window.innerHeight;
      const block = $("#about");
      if (height > 1100) {
        block.addClass("animate");
      }
    },
    scrollEvent: function () {
      DOC.scroll(function () {
        const scrollTop = DOC.scrollTop();
        App.setAnimationClass(scrollTop);
      });
    },
    setAnimationClass: function (scrollTop) {
      $.map(animationObj, function (value, key) {
        const { offset, animated } = value;
        if (!animated) {
          if (scrollTop >= offset + 100) {
            const node = $(`[data-animated="${key}"]`);
            node.addClass("animate");
          }
        }
      });
    },
    animateGallery: function () {
      const imgList = $(".wrap-img");
      const btnShowInfo = $('.js-show-info');
      const itemsGallery = $('.gallery__item');
      btnShowInfo.click(function (e) {
        e.preventDefault();
        const _this = $(this);
        itemsGallery.removeClass('active');
        _this.parents('.gallery__item').removeClass("no-animate");
        _this.parents('.gallery__item').addClass("animate");
        _this.parents('.gallery__item').addClass('active');
      });


      $('.gallery__close').click(function (e) {
        e.preventDefault();
        const _this = $(this);
        _this.parents('.gallery__item').removeClass('active');
        _this.parents('.gallery__item').removeClass("no-animate");
        _this.parents('.gallery__item').removeClass("show-slider");
        _this.parents('.gallery__item').addClass("animate");
      });


      imgList.click(function () {
        const _this = $(this);
        const slidePhoto = _this.find("img").data("scr");
        _this.parents('.gallery__item').removeClass("animate");
        _this.parents('.gallery__item').addClass("no-animate");
        _this.parents('.gallery__item').addClass('show-slider');
        setTimeout(() => {
          $(".slider-for").slick("slickGoTo", slidePhoto);
          $(".slider").fadeIn(500);
        }, 700);
      });
    },
    sliderGallery: function () {
      $(".slider-for").slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        fade: true,
        asNavFor: ".slider-nav"
      });
      $(".slider-nav").slick({
        slidesToShow: 13,
        slidesToScroll: 1,
        asNavFor: ".slider-for",
        dots: false,
        arrows: false,
        centerMode: true,
        focusOnSelect: true,
        responsive: [
          {
            breakpoint: 1681,
            settings: {
              slidesToShow: 10
            }
          },
          {
            breakpoint: 1281,
            settings: {
              slidesToShow: 8
            }
          },
          {
            breakpoint: 1025,
            settings: {
              slidesToShow: 7
            }
          },
          {
            breakpoint: 901,
            settings: {
              slidesToShow: 6
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 5
            }
          },
          {
            breakpoint: 641,
            settings: {
              slidesToShow: 4
            }
          },
          {
            breakpoint: 481,
            settings: {
              slidesToShow: 3
            }
          }
        ]
      });
    },
    destroySlick: function () {
      $(".slider-for").slick("unslick");
      $(".slider-nav").slick("unslick");
    },
    sliderReviews: function () {
      $('.reviews__slider').slick({
        dots: true,
        infinite: false,
        speed: 500,
        variableWidth: true,
        cssEase: "linear",
        swipeToSlide: true,
        arrows: true,
        responsive: [
          {
            breakpoint: 1025,
            settings: {
              variableWidth: false,
              slidesToShow: 2,
              slidesToScroll: 1,
              adaptiveHeight: true
            }
          },
          {
            breakpoint: 901,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              adaptiveHeight: true,
              variableWidth: false,
            }
          }
        ]
      });
    },
    sliderEvents: function () {
      $('.js-slider-event').slick({
        infinite: false,
        speed: 500,
        cssEase: "linear",
        arrows: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        responsive: [
          {
            breakpoint: 901,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            }
          },
          {
            breakpoint: 571,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            }
          }
        ]
      });
    },
    timerMeetup: function () {
      function timer() {
        var today = new Date();
        var countDownDate = new Date(2019, 11, 1, 18, 0);
        var distance = countDownDate - today;

        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        days = (days < 10) ? ('0' + days).slice(-2) : days;
        hours = (hours < 10) ? ('0' + hours).slice(-2) : hours;
        minutes = (minutes < 10) ? ('0' + minutes).slice(-2) : minutes;

        var daysTo = $('.days').find('.el__item');
        var hoursTo = $('.hours').find('.el__item');
        var minutesTo = $('.minutes').find('.el__item');

        App.timeToHtml(daysTo, days);
        App.timeToHtml(hoursTo, hours);
        App.timeToHtml(minutesTo, minutes);

      }
      setInterval(timer, 1000);

    },
    timeToHtml: function (container, time) {
      for (let i = 0; i < container.length; i++) {
        const element = container[i];
        element.textContent = time.toString()[i];
      }
    },
    initPopup: function () {
      const overlay = $(".js-overlay");
      const popUpBlock = $(".js-popup");

      $(".js-show-popUp").click(function (e) {
        e.preventDefault();

        const _this = $(this);

        const date = _this.parent('.next-item').find('.js-date').text();
        const place = _this.parent('.next-item').find('.js-place').text();

        popupContent.prepend(App.createPopupContent(date, place));

        const target = $(_this.data("target"));
        target.toggleClass("active");
        overlay.addClass("active");

      });
      $(".js-close, .js-overlay").click(function (e) {
        e.preventDefault();
        const _this = $(this);
        const title = _this.siblings(popupContent).find('.popup-meetup__ttl');
        title.html(' ');
        popUpBlock.removeClass("active");
        overlay.removeClass("active");
      });
    },
    createPopupContent: function (date, place) {
      const popupTitle = `<p class="popup-meetup__ttl">Зарегистрироваться на сходку Affhub ${place},<br/> <span class="date">${date}</span></p>`;
      return popupTitle;
    },
    init: function () {
      App.sliderEvents();
      App.initPopup();
      App.createPopupContent();
      App.scrollToTarget(".js-item-scroll", 700);
      App.burgerMenuShow();
      App.labelFormActive();
      App.addFormSubmitEvent();
      App.detectAnimationBlocks();
      App.scrollEvent();
      App.animateAboutBlock();
      App.animateGallery();
      if ($(window).width() < 900) {
        $(".slider").fadeIn(500);
      } else {
        $(".slider").fadeOut(500);
      }
      App.sliderGallery();
      App.sliderReviews();
      App.timerMeetup();
    }
  };
})(),
  register = event => {
    event.preventDefault();
    clearErrors();
    const formDataErrors = [],
      formEl = document.getElementById("registration_form");
    var data = {};
    new FormData(formEl).forEach(function (value, key) {
      if (value) data[key] = value;
    });
    !/([A-Za-zА-ЯЄІЇа-яєії])+$/g.test(data.name) &&
      formDataErrors.push({
        field: "name",
        maessage: data.name ? "Некорректное имя" : "Имя обязательно"
      });
    (data.phone && !/[0-9+()-\s]{5,}/g.test(data.phone)) &&
      formDataErrors.push({
        field: "phone",
        maessage: "Некорректный номер телефона"
      });
    (data.telegram && !/\@?[\d\w]{5,}/g.test(data.telegram)) &&
      formDataErrors.push({
        field: "telegram",
        maessage: "Некорректный телеграм логин"
      });
    (!data.phone && !data.telegram) &&
      formDataErrors.push({
        field: "phone",
        maessage: "Номер телефона или телеграм логин обязателен"
      });
    if (formDataErrors.length) return handleFormErrors(formDataErrors);
    $.ajax({
      url: "/api/affhub/rostovNaDony",
      method: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      beforeSend: switchButton()
    })
      .done(function () {
        clearFields();
        switchThanksMessage();
      })
      .fail(function () { })
      .always(function () {
        switchButton();
      });
  },
  handleFormErrors = errors => {
    errors.forEach(error => {
      document.getElementById(`${error.field}_error`).innerHTML =
        error.maessage;
    });
  },
  clearErrors = () => {
    const errorElements = document.getElementsByClassName("form_error");
    for (let el of errorElements) el.innerHTML = null;
  },
  clearFields = () => {
    for (let input of document
      .getElementById("registration_form")
      .getElementsByTagName("input"))
      input.value = null;
  },
  switchButton = () => {
    document.getElementsByClassName(
      "form__btn"
    )[0].disabled = !document.getElementsByClassName("form__btn")[0].disabled;
  },
  switchThanksMessage = event => {
    if (!event) {
      document.getElementById("main-form").style.display = "none";
      return (document.getElementById("thanks-form-message").style.display =
        "block");
    }
    document.getElementById("thanks-form-message").style.display = "none";
    document.getElementById("main-form").style.display = "block";
  };

$(document).ready(function () {
  App.init();
  var i, c, y, v, n;
  v = document.getElementsByClassName("youtube");
  for (n = 0; n < v.length; n++) {
    y = v[n];
    i = document.createElement("img");
    i.setAttribute("src", "http://i.ytimg.com/vi/" + y.id + "/hqdefault.jpg");
    i.setAttribute("class", "thumb");
    c = document.createElement("div");
    c.setAttribute("class", "play");
    y.appendChild(i);
    y.appendChild(c);
    y.onclick = function () {
      var a = document.createElement("iframe");
      a.setAttribute("src", "https://www.youtube.com/embed/" + this.id + "?autoplay=1&autohide=1&border=0&wmode=opaque&enablejsapi=1");
      a.style.width = this.style.width;
      a.style.height = this.style.height;
      this.parentNode.replaceChild(a, this)
    }
  }
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImxldCBsb2FkZWQgPSAhMTtcbiEgZnVuY3Rpb24gKCkge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBsYWNlXCIpLCBTbmFwKFwiI3BsYWNlXCIpO1xuICBjb25zdCBwaW5rQ2lyY2xlID0gU25hcC5zZWxlY3QoXCIucGlua0NpcmNsZVwiKSxcbiAgICBwaW5rU3RhciA9IFNuYXAuc2VsZWN0KFwiLnBpbmtTdGFyXCIpLFxuICAgIHBpbmtMaW5lID0gU25hcC5zZWxlY3QoXCIucGlua0xpbmVcIiksXG4gICAgcGlua1NxdWFyZSA9IFNuYXAuc2VsZWN0KFwiLnBpbmtTcXVhcmVcIiksXG4gICAgcGlua1N0YXJQb2ludHMgPSAocGlua0NpcmNsZS5ub2RlLmdldEF0dHJpYnV0ZShcImRcIiksIHBpbmtTdGFyLm5vZGUuZ2V0QXR0cmlidXRlKFwiZFwiKSksXG4gICAgcGlua0xpbmVQb2ludHMgPSBwaW5rTGluZS5ub2RlLmdldEF0dHJpYnV0ZShcImRcIiksXG4gICAgcGlua1NxdWFyZVBvaW50cyA9IHBpbmtTcXVhcmUubm9kZS5nZXRBdHRyaWJ1dGUoXCJkXCIpLFxuICAgIGdyZWVuQ2lyY2xlID0gU25hcC5zZWxlY3QoXCIuZ3JlZW5DaXJjbGVcIiksXG4gICAgZ3JlZW5TdGFyID0gU25hcC5zZWxlY3QoXCIuZ3JlZW5TdGFyXCIpLFxuICAgIGdyZWVuTGluZSA9IFNuYXAuc2VsZWN0KFwiLmdyZWVuTGluZVwiKSxcbiAgICBncmVlblNxdWFyZSA9IFNuYXAuc2VsZWN0KFwiLmdyZWVuU3F1YXJlXCIpLFxuICAgIGdyZWVuU3RhclBvaW50cyA9IChncmVlbkNpcmNsZS5ub2RlLmdldEF0dHJpYnV0ZShcImRcIiksIGdyZWVuU3Rhci5ub2RlLmdldEF0dHJpYnV0ZShcImRcIikpLFxuICAgIGdyZWVuTGluZVBvaW50cyA9IGdyZWVuTGluZS5ub2RlLmdldEF0dHJpYnV0ZShcImRcIiksXG4gICAgZ3JlZW5TcXVhcmVQb2ludHMgPSBncmVlblNxdWFyZS5ub2RlLmdldEF0dHJpYnV0ZShcImRcIiksXG4gICAgcmVkQ2lyY2xlID0gU25hcC5zZWxlY3QoXCIucmVkQ2lyY2xlXCIpLFxuICAgIHJlZFN0YXIgPSBTbmFwLnNlbGVjdChcIi5yZWRTdGFyXCIpLFxuICAgIHJlZExpbmUgPSBTbmFwLnNlbGVjdChcIi5yZWRMaW5lXCIpLFxuICAgIHJlZFNxdWFyZSA9IFNuYXAuc2VsZWN0KFwiLnJlZFNxdWFyZVwiKSxcbiAgICByZWRTdGFyUG9pbnRzID0gKHJlZENpcmNsZS5ub2RlLmdldEF0dHJpYnV0ZShcImRcIiksIHJlZFN0YXIubm9kZS5nZXRBdHRyaWJ1dGUoXCJkXCIpKSxcbiAgICByZWRMaW5lUG9pbnRzID0gcmVkTGluZS5ub2RlLmdldEF0dHJpYnV0ZShcImRcIiksXG4gICAgcmVkU3F1YXJlUG9pbnRzID0gcmVkU3F1YXJlLm5vZGUuZ2V0QXR0cmlidXRlKFwiZFwiKSxcbiAgICBibHVlQ2lyY2xlID0gU25hcC5zZWxlY3QoXCIuYmx1ZUNpcmNsZVwiKSxcbiAgICBibHVlU3RhciA9IFNuYXAuc2VsZWN0KFwiLmJsdWVTdGFyXCIpLFxuICAgIGJsdWVMaW5lID0gU25hcC5zZWxlY3QoXCIuYmx1ZUxpbmVcIiksXG4gICAgYmx1ZVNxdWFyZSA9IFNuYXAuc2VsZWN0KFwiLmJsdWVTcXVhcmVcIiksXG4gICAgYmx1ZVN0YXJQb2ludHMgPSAoYmx1ZUNpcmNsZS5ub2RlLmdldEF0dHJpYnV0ZShcImRcIiksIGJsdWVTdGFyLm5vZGUuZ2V0QXR0cmlidXRlKFwiZFwiKSksXG4gICAgYmx1ZUxpbmVQb2ludHMgPSBibHVlTGluZS5ub2RlLmdldEF0dHJpYnV0ZShcImRcIiksXG4gICAgYmx1ZVNxdWFyZVBvaW50cyA9IGJsdWVTcXVhcmUubm9kZS5nZXRBdHRyaWJ1dGUoXCJkXCIpLFxuICAgIG9yYW5nZUNpcmNsZSA9IFNuYXAuc2VsZWN0KFwiLm9yYW5nZUNpcmNsZVwiKSxcbiAgICBvcmFuZ2VTdGFyID0gU25hcC5zZWxlY3QoXCIub3JhbmdlU3RhclwiKSxcbiAgICBvcmFuZ2VMaW5lID0gU25hcC5zZWxlY3QoXCIub3JhbmdlTGluZVwiKSxcbiAgICBvcmFuZ2VTcXVhcmUgPSBTbmFwLnNlbGVjdChcIi5vcmFuZ2VTcXVhcmVcIiksXG4gICAgb3JhbmdlU3RhclBvaW50cyA9IChvcmFuZ2VDaXJjbGUubm9kZS5nZXRBdHRyaWJ1dGUoXCJkXCIpLCBvcmFuZ2VTdGFyLm5vZGUuZ2V0QXR0cmlidXRlKFwiZFwiKSksXG4gICAgb3JhbmdlTGluZVBvaW50cyA9IG9yYW5nZUxpbmUubm9kZS5nZXRBdHRyaWJ1dGUoXCJkXCIpLFxuICAgIG9yYW5nZVNxdWFyZVBvaW50cyA9IG9yYW5nZVNxdWFyZS5ub2RlLmdldEF0dHJpYnV0ZShcImRcIik7XG4gIHZhciBhbmltID0gZnVuY3Rpb24gKHRhcmdldCwgcG9pbnRzKSB7XG4gICAgdGFyZ2V0LmFuaW1hdGUoe1xuICAgICAgZDogcG9pbnRzXG4gICAgfSwgNDAwLCBtaW5hLmVsYXN0aWMoKSlcbiAgfTtcblxuICBmdW5jdGlvbiBzdGFyKCkge1xuICAgIGlmICghbG9hZGVkKSB7XG4gICAgICBhbmltKHBpbmtDaXJjbGUsIHBpbmtTdGFyUG9pbnRzKTtcbiAgICAgIGFuaW0oZ3JlZW5DaXJjbGUsIGdyZWVuU3RhclBvaW50cyk7XG4gICAgICBhbmltKHJlZENpcmNsZSwgcmVkU3RhclBvaW50cyk7XG4gICAgICBhbmltKGJsdWVDaXJjbGUsIGJsdWVTdGFyUG9pbnRzKTtcbiAgICAgIGFuaW0ob3JhbmdlQ2lyY2xlLCBvcmFuZ2VTdGFyUG9pbnRzKTtcbiAgICAgIHNldFRpbWVvdXQobGluZSwgNTAwKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmUoKSB7XG4gICAgaWYgKCFsb2FkZWQpIHtcbiAgICAgIGFuaW0ocGlua0NpcmNsZSwgcGlua0xpbmVQb2ludHMpO1xuICAgICAgYW5pbShncmVlbkNpcmNsZSwgZ3JlZW5MaW5lUG9pbnRzKTtcbiAgICAgIGFuaW0ocmVkQ2lyY2xlLCByZWRMaW5lUG9pbnRzKTtcbiAgICAgIGFuaW0oYmx1ZUNpcmNsZSwgYmx1ZUxpbmVQb2ludHMpO1xuICAgICAgYW5pbShvcmFuZ2VDaXJjbGUsIG9yYW5nZUxpbmVQb2ludHMpO1xuICAgICAgc2V0VGltZW91dChzcXVhcmUsIDUwMClcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzcXVhcmUoKSB7XG4gICAgaWYgKCFsb2FkZWQpIHtcbiAgICAgIGFuaW0ocGlua0NpcmNsZSwgcGlua1NxdWFyZVBvaW50cyk7XG4gICAgICBhbmltKGdyZWVuQ2lyY2xlLCBncmVlblNxdWFyZVBvaW50cyk7XG4gICAgICBhbmltKHJlZENpcmNsZSwgcmVkU3F1YXJlUG9pbnRzKTtcbiAgICAgIGFuaW0oYmx1ZUNpcmNsZSwgYmx1ZVNxdWFyZVBvaW50cyk7XG4gICAgICBhbmltKG9yYW5nZUNpcmNsZSwgb3JhbmdlU3F1YXJlUG9pbnRzKTtcbiAgICAgIHNldFRpbWVvdXQoc3RhciwgNTAwKVxuICAgIH1cbiAgfVxuICBzZXRUaW1lb3V0KHN0YXIsIDEwMClcbn0oKTtcbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIGxldCBsb2FkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmxvYWRlclwiKTtcbiAgbG9hZGVkID0gITA7XG4gIGxvYWRlci5jbGFzc0xpc3QuYWRkKFwiaGlkZVwiKTtcbiAgd2luZG93LmlubmVyV2lkdGggPj0gMTAyMyAmJiBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBTY3JvbGxNYWdpYy5Db250cm9sbGVyO1xuICAgIGNvbnN0IG15VGltZUxpbmUgPSBuZXcgVGltZWxpbmVNYXgoKTtcbiAgICBteVRpbWVMaW5lXG4gICAgICAuc3RhZ2dlckZyb21UbygnLmxldHRlcicsIDEsIHsgeDogLTEwLCBvcGFjaXR5OiAwIH0sIHsgeDogMCwgb3BhY2l0eTogMSB9LCAwLjEpXG4gICAgICAuZnJvbVRvKCcubG9nbycsIDEsIHsgeDogLTMwLCBvcGFjaXR5OiAwIH0sIHsgeDogMCwgb3BhY2l0eTogMSB9LCAwKVxuICAgICAgLmZyb21UbygnLm5hdl9faXRlbScsIDEsIHsgeTogLTUwLCBvcGFjaXR5OiAwIH0sIHsgeTogMCwgb3BhY2l0eTogMSB9LCAwKVxuICAgICAgLmZyb21UbygnLnRpdGxlJywgMSwgeyB4OiAtMTUwLCBvcGFjaXR5OiAwIH0sIHsgeDogMCwgb3BhY2l0eTogMSB9LCAwKVxuICAgICAgLmZyb21UbygnLnRvcF9fdHRsJywgMSwgeyB5OiAtMzAsIG9wYWNpdHk6IDAgfSwgeyB5OiAwLCBvcGFjaXR5OiAxIH0sIDAuMilcbiAgICAgIC5mcm9tVG8oJy50b3BfX2NlbnRlciAudGV4dCcsIDEsIHsgeDogNTAsIG9wYWNpdHk6IDAgfSwgeyB4OiAwLCBvcGFjaXR5OiAxIH0sIDAuMSlcbiAgICAgIC5mcm9tVG8oJy5qcy1kYXknLCAxLCB7IHg6IC0zMCwgb3BhY2l0eTogMCB9LCB7IHg6IDAsIG9wYWNpdHk6IDEgfSwgMC4zKVxuICAgICAgLmZyb21UbygnLnBvc3Rlcl9fZGF5JywgMSwgeyB4OiAzMCwgb3BhY2l0eTogMCB9LCB7IHg6IDAsIG9wYWNpdHk6IDEgfSwgMC4xKVxuICAgIGNvbnN0IG15VGltZUxpbmVBYm91dCA9IG5ldyBUaW1lbGluZU1heCgpO1xuICAgIG15VGltZUxpbmVBYm91dFxuICAgICAgLmZyb21UbygnLndoeV9fdGl0bGUnLCAxLCB7IHg6IC0zMCwgb3BhY2l0eTogMCB9LCB7IHg6IDAsIG9wYWNpdHk6IDEgfSwgMClcbiAgICBuZXcgU2Nyb2xsTWFnaWMuU2NlbmUoe1xuICAgICAgdHJpZ2dlckVsZW1lbnQ6IFwiLndoeVwiLFxuICAgICAgcmV2ZXJzZTogITFcbiAgICB9KS5zZXRUd2VlbihteVRpbWVMaW5lQWJvdXQpLmFkZFRvKGNvbnRyb2xsZXIpO1xuICAgIGNvbnN0IG15VGltZUxpbmVTcGVha2VycyA9IG5ldyBUaW1lbGluZU1heCgpO1xuICAgIG15VGltZUxpbmVTcGVha2Vyc1xuICAgICAgLnN0YWdnZXJGcm9tVG8oJy5zcGVha2VyJywgMSwgeyB4OiAtMTAsIG9wYWNpdHk6IDAgfSwgeyB4OiAwLCBvcGFjaXR5OiAxIH0sIDAuMSlcbiAgICBuZXcgU2Nyb2xsTWFnaWMuU2NlbmUoe1xuICAgICAgdHJpZ2dlckVsZW1lbnQ6IFwiLnNwZWFrZXJzXCIsXG4gICAgICByZXZlcnNlOiAhMVxuICAgIH0pLnNldFR3ZWVuKG15VGltZUxpbmVTcGVha2VycykuYWRkVG8oY29udHJvbGxlcik7XG4gICAgY29uc3QgbXlUaW1lTGluZVRpbWVsaW5lID0gbmV3IFRpbWVsaW5lTWF4KCk7XG4gICAgbXlUaW1lTGluZVRpbWVsaW5lXG4gICAgICAuc3RhZ2dlckZyb21UbygnLmpzLWl0ZW0nLCAxLCB7IHk6IC0xMCwgb3BhY2l0eTogMCB9LCB7IHk6IDAsIG9wYWNpdHk6IDEgfSwgMC4xKVxuICAgIG5ldyBTY3JvbGxNYWdpYy5TY2VuZSh7XG4gICAgICB0cmlnZ2VyRWxlbWVudDogXCIudGltZWxpbmVcIixcbiAgICAgIHJldmVyc2U6ICExXG4gICAgfSkuc2V0VHdlZW4obXlUaW1lTGluZVRpbWVsaW5lKS5hZGRUbyhjb250cm9sbGVyKTtcbiAgfSgpXG59O1xuXG5jb25zdCBBcHAgPSAoZnVuY3Rpb24gKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgY29uc3QgYnVyZ2VyTWVudSA9ICQoXCIuanMtYnVyZ2VyXCIpLFxuICAgIG5hdk1lbnVNb2JpbGUgPSAkKFwiI2pzLW1vYmlsZS1tZW51XCIpLFxuICAgIGNvbnRlbnRBbGwgPSAkKFwiLmJsb2NrXCIpLFxuICAgIERPQyA9ICQoZG9jdW1lbnQpO1xuICBsZXQgYW5pbWF0aW9uT2JqID0ge307XG4gIGNvbnN0IHBvcHVwQ29udGVudCA9ICQoJy5wb3B1cC1tZWV0dXBfX2NvbnRlbnQnKTtcblxuXG4gIHJldHVybiB7XG4gICAgYnVyZ2VyTWVudVNob3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGJ1cmdlck1lbnUuY2xpY2soZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBocmVmID0gJCh0aGlzKS5kYXRhKFwidGFyZ2V0XCIpO1xuICAgICAgICAkKGhyZWYpLnRvZ2dsZUNsYXNzKFwibWVudS1tb2JpbGUtLWFjdGl2ZVwiKTtcbiAgICAgICAgYnVyZ2VyTWVudS50b2dnbGVDbGFzcyhcImJ1cmdlci0tYWN0aXZlXCIpO1xuICAgICAgICBjb250ZW50QWxsLnRvZ2dsZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICBub1Njcm9sbC50b2dnbGUoKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgc2Nyb2xsVG9UYXJnZXQ6IGZ1bmN0aW9uIChzY3JvbGxTZWxlY3Rvciwgc3BlZWQpIHtcbiAgICAgIGNvbnN0IGxpbmtzID0gJChzY3JvbGxTZWxlY3Rvcik7XG4gICAgICBsaW5rcy5jbGljayhmdW5jdGlvbiAoZSkge1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgX3RoaXMgPSAkKHRoaXMpO1xuICAgICAgICBub1Njcm9sbC5vZmYoKTtcbiAgICAgICAgY29udGVudEFsbC5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgbmF2TWVudU1vYmlsZS5yZW1vdmVDbGFzcyhcIm1lbnUtbW9iaWxlLS1hY3RpdmVcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKF90aGlzKTtcblxuICAgICAgICBidXJnZXJNZW51LnJlbW92ZUNsYXNzKFwiYnVyZ2VyLS1hY3RpdmVcIik7XG4gICAgICAgIGxpbmtzLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICBfdGhpcy5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgY29uc3QgaHJlZiA9IF90aGlzLmF0dHIoXCJocmVmXCIpO1xuICAgICAgICBpZiAoaHJlZi5sZW5ndGggPD0gMSkgcmV0dXJuO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSAkKGhyZWYpO1xuICAgICAgICBpZiAoIXRhcmdldC5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgY29uc3QgdG9wID0gdGFyZ2V0Lm9mZnNldCgpLnRvcDtcbiAgICAgICAgJChcImh0bWwsIGJvZHlcIikuYW5pbWF0ZShcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzY3JvbGxUb3A6IHRvcCAtIDQwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzcGVlZFxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBsYWJlbEZvcm1BY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoXCIuanMtaW5wdXRcIikua2V5dXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLnZhbCgpXG4gICAgICAgICAgPyAkKHRoaXMpLmFkZENsYXNzKFwiYWN0aXZlXCIpXG4gICAgICAgICAgOiAkKHRoaXMpLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICAvLyBhZGRGb3JtU3VibWl0RXZlbnQ6ICgpID0+IHtcbiAgICAvLyAgIGNvbnN0IHRoYW5rc0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVwZWF0LWZvcm1cIik7XG4gICAgLy8gICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJlZ2lzdHJhdGlvbl9mb3JtXCIpLm9uc3VibWl0ID0gcmVnaXN0ZXI7XG4gICAgLy8gICB0aGFua3NCdXR0b24ub25jbGljayA9IHN3aXRjaFRoYW5rc01lc3NhZ2U7XG4gICAgLy8gfSxcbiAgICBkZXRlY3RBbmltYXRpb25CbG9ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGJsb2NrcyA9ICQoXCJbZGF0YS1hbmltYXRlZF1cIik7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBibG9jayA9ICQoYmxvY2tzW2ldKTtcbiAgICAgICAgY29uc3Qga2V5ID0gYmxvY2suZGF0YShcImFuaW1hdGVkXCIpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcnNlSW50KGJsb2NrLm9mZnNldCgpLnRvcCAtICQod2luZG93KS5oZWlnaHQoKSAvIDEuNSk7XG4gICAgICAgIGFuaW1hdGlvbk9ialtrZXldID0ge1xuICAgICAgICAgIG9mZnNldDogdmFsdWUsXG4gICAgICAgICAgYW5pbWF0ZWQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgICBhbmltYXRlQWJvdXRCbG9jazogZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgY29uc3QgYmxvY2sgPSAkKFwiI2Fib3V0XCIpO1xuICAgICAgaWYgKGhlaWdodCA+IDExMDApIHtcbiAgICAgICAgYmxvY2suYWRkQ2xhc3MoXCJhbmltYXRlXCIpO1xuICAgICAgfVxuICAgIH0sXG4gICAgc2Nyb2xsRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIERPQy5zY3JvbGwoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBzY3JvbGxUb3AgPSBET0Muc2Nyb2xsVG9wKCk7XG4gICAgICAgIEFwcC5zZXRBbmltYXRpb25DbGFzcyhzY3JvbGxUb3ApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBzZXRBbmltYXRpb25DbGFzczogZnVuY3Rpb24gKHNjcm9sbFRvcCkge1xuICAgICAgJC5tYXAoYW5pbWF0aW9uT2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICBjb25zdCB7IG9mZnNldCwgYW5pbWF0ZWQgfSA9IHZhbHVlO1xuICAgICAgICBpZiAoIWFuaW1hdGVkKSB7XG4gICAgICAgICAgaWYgKHNjcm9sbFRvcCA+PSBvZmZzZXQgKyAxMDApIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSAkKGBbZGF0YS1hbmltYXRlZD1cIiR7a2V5fVwiXWApO1xuICAgICAgICAgICAgbm9kZS5hZGRDbGFzcyhcImFuaW1hdGVcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFuaW1hdGVHYWxsZXJ5OiBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBpbWdMaXN0ID0gJChcIi53cmFwLWltZ1wiKTtcbiAgICAgIGNvbnN0IGJ0blNob3dJbmZvID0gJCgnLmpzLXNob3ctaW5mbycpO1xuICAgICAgY29uc3QgaXRlbXNHYWxsZXJ5ID0gJCgnLmdhbGxlcnlfX2l0ZW0nKTtcbiAgICAgIGJ0blNob3dJbmZvLmNsaWNrKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgX3RoaXMgPSAkKHRoaXMpO1xuICAgICAgICBpdGVtc0dhbGxlcnkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICBfdGhpcy5wYXJlbnRzKCcuZ2FsbGVyeV9faXRlbScpLnJlbW92ZUNsYXNzKFwibm8tYW5pbWF0ZVwiKTtcbiAgICAgICAgX3RoaXMucGFyZW50cygnLmdhbGxlcnlfX2l0ZW0nKS5hZGRDbGFzcyhcImFuaW1hdGVcIik7XG4gICAgICAgIF90aGlzLnBhcmVudHMoJy5nYWxsZXJ5X19pdGVtJykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgfSk7XG5cblxuICAgICAgJCgnLmdhbGxlcnlfX2Nsb3NlJykuY2xpY2soZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBfdGhpcyA9ICQodGhpcyk7XG4gICAgICAgIF90aGlzLnBhcmVudHMoJy5nYWxsZXJ5X19pdGVtJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICBfdGhpcy5wYXJlbnRzKCcuZ2FsbGVyeV9faXRlbScpLnJlbW92ZUNsYXNzKFwibm8tYW5pbWF0ZVwiKTtcbiAgICAgICAgX3RoaXMucGFyZW50cygnLmdhbGxlcnlfX2l0ZW0nKS5yZW1vdmVDbGFzcyhcInNob3ctc2xpZGVyXCIpO1xuICAgICAgICBfdGhpcy5wYXJlbnRzKCcuZ2FsbGVyeV9faXRlbScpLmFkZENsYXNzKFwiYW5pbWF0ZVwiKTtcbiAgICAgIH0pO1xuXG5cbiAgICAgIGltZ0xpc3QuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBfdGhpcyA9ICQodGhpcyk7XG4gICAgICAgIGNvbnN0IHNsaWRlUGhvdG8gPSBfdGhpcy5maW5kKFwiaW1nXCIpLmRhdGEoXCJzY3JcIik7XG4gICAgICAgIF90aGlzLnBhcmVudHMoJy5nYWxsZXJ5X19pdGVtJykucmVtb3ZlQ2xhc3MoXCJhbmltYXRlXCIpO1xuICAgICAgICBfdGhpcy5wYXJlbnRzKCcuZ2FsbGVyeV9faXRlbScpLmFkZENsYXNzKFwibm8tYW5pbWF0ZVwiKTtcbiAgICAgICAgX3RoaXMucGFyZW50cygnLmdhbGxlcnlfX2l0ZW0nKS5hZGRDbGFzcygnc2hvdy1zbGlkZXInKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgJChcIi5zbGlkZXItZm9yXCIpLnNsaWNrKFwic2xpY2tHb1RvXCIsIHNsaWRlUGhvdG8pO1xuICAgICAgICAgICQoXCIuc2xpZGVyXCIpLmZhZGVJbig1MDApO1xuICAgICAgICB9LCA3MDApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBzbGlkZXJHYWxsZXJ5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKFwiLnNsaWRlci1mb3JcIikuc2xpY2soe1xuICAgICAgICBzbGlkZXNUb1Nob3c6IDEsXG4gICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxuICAgICAgICBhcnJvd3M6IHRydWUsXG4gICAgICAgIGZhZGU6IHRydWUsXG4gICAgICAgIGFzTmF2Rm9yOiBcIi5zbGlkZXItbmF2XCJcbiAgICAgIH0pO1xuICAgICAgJChcIi5zbGlkZXItbmF2XCIpLnNsaWNrKHtcbiAgICAgICAgc2xpZGVzVG9TaG93OiAxMyxcbiAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDEsXG4gICAgICAgIGFzTmF2Rm9yOiBcIi5zbGlkZXItZm9yXCIsXG4gICAgICAgIGRvdHM6IGZhbHNlLFxuICAgICAgICBhcnJvd3M6IGZhbHNlLFxuICAgICAgICBjZW50ZXJNb2RlOiB0cnVlLFxuICAgICAgICBmb2N1c09uU2VsZWN0OiB0cnVlLFxuICAgICAgICByZXNwb25zaXZlOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYnJlYWtwb2ludDogMTY4MSxcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMTBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDEyODEsXG4gICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDhcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDEwMjUsXG4gICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDkwMSxcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogNlxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgYnJlYWtwb2ludDogNzY4LFxuICAgICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgc2xpZGVzVG9TaG93OiA1XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBicmVha3BvaW50OiA2NDEsXG4gICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDQ4MSxcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogM1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZXN0cm95U2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICQoXCIuc2xpZGVyLWZvclwiKS5zbGljayhcInVuc2xpY2tcIik7XG4gICAgICAkKFwiLnNsaWRlci1uYXZcIikuc2xpY2soXCJ1bnNsaWNrXCIpO1xuICAgIH0sXG4gICAgc2xpZGVyUmV2aWV3czogZnVuY3Rpb24gKCkge1xuICAgICAgJCgnLnJldmlld3NfX3NsaWRlcicpLnNsaWNrKHtcbiAgICAgICAgZG90czogdHJ1ZSxcbiAgICAgICAgaW5maW5pdGU6IGZhbHNlLFxuICAgICAgICBzcGVlZDogNTAwLFxuICAgICAgICB2YXJpYWJsZVdpZHRoOiB0cnVlLFxuICAgICAgICBjc3NFYXNlOiBcImxpbmVhclwiLFxuICAgICAgICBzd2lwZVRvU2xpZGU6IHRydWUsXG4gICAgICAgIGFycm93czogdHJ1ZSxcbiAgICAgICAgcmVzcG9uc2l2ZTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDEwMjUsXG4gICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICB2YXJpYWJsZVdpZHRoOiBmYWxzZSxcbiAgICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAyLFxuICAgICAgICAgICAgICBzbGlkZXNUb1Njcm9sbDogMSxcbiAgICAgICAgICAgICAgYWRhcHRpdmVIZWlnaHQ6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDkwMSxcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMSxcbiAgICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDEsXG4gICAgICAgICAgICAgIGFkYXB0aXZlSGVpZ2h0OiB0cnVlLFxuICAgICAgICAgICAgICB2YXJpYWJsZVdpZHRoOiBmYWxzZSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgc2xpZGVyRXZlbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKCcuanMtc2xpZGVyLWV2ZW50Jykuc2xpY2soe1xuICAgICAgICBpbmZpbml0ZTogZmFsc2UsXG4gICAgICAgIHNwZWVkOiA1MDAsXG4gICAgICAgIGNzc0Vhc2U6IFwibGluZWFyXCIsXG4gICAgICAgIGFycm93czogdHJ1ZSxcbiAgICAgICAgc2xpZGVzVG9TaG93OiAzLFxuICAgICAgICBzbGlkZXNUb1Njcm9sbDogMSxcbiAgICAgICAgcmVzcG9uc2l2ZTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDkwMSxcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMixcbiAgICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDEsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBicmVha3BvaW50OiA1NzEsXG4gICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDEsXG4gICAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgfSxcbiAgICB0aW1lck1lZXR1cDogZnVuY3Rpb24gKCkge1xuICAgICAgZnVuY3Rpb24gdGltZXIoKSB7XG4gICAgICAgIHZhciB0b2RheSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciBjb3VudERvd25EYXRlID0gbmV3IERhdGUoMjAxOSwgMTEsIDEsIDE4LCAwKTtcbiAgICAgICAgdmFyIGRpc3RhbmNlID0gY291bnREb3duRGF0ZSAtIHRvZGF5O1xuXG4gICAgICAgIHZhciBkYXlzID0gTWF0aC5mbG9vcihkaXN0YW5jZSAvICgxMDAwICogNjAgKiA2MCAqIDI0KSk7XG4gICAgICAgIHZhciBob3VycyA9IE1hdGguZmxvb3IoKGRpc3RhbmNlICUgKDEwMDAgKiA2MCAqIDYwICogMjQpKSAvICgxMDAwICogNjAgKiA2MCkpO1xuICAgICAgICB2YXIgbWludXRlcyA9IE1hdGguZmxvb3IoKGRpc3RhbmNlICUgKDEwMDAgKiA2MCAqIDYwKSkgLyAoMTAwMCAqIDYwKSk7XG5cbiAgICAgICAgZGF5cyA9IChkYXlzIDwgMTApID8gKCcwJyArIGRheXMpLnNsaWNlKC0yKSA6IGRheXM7XG4gICAgICAgIGhvdXJzID0gKGhvdXJzIDwgMTApID8gKCcwJyArIGhvdXJzKS5zbGljZSgtMikgOiBob3VycztcbiAgICAgICAgbWludXRlcyA9IChtaW51dGVzIDwgMTApID8gKCcwJyArIG1pbnV0ZXMpLnNsaWNlKC0yKSA6IG1pbnV0ZXM7XG5cbiAgICAgICAgdmFyIGRheXNUbyA9ICQoJy5kYXlzJykuZmluZCgnLmVsX19pdGVtJyk7XG4gICAgICAgIHZhciBob3Vyc1RvID0gJCgnLmhvdXJzJykuZmluZCgnLmVsX19pdGVtJyk7XG4gICAgICAgIHZhciBtaW51dGVzVG8gPSAkKCcubWludXRlcycpLmZpbmQoJy5lbF9faXRlbScpO1xuXG4gICAgICAgIEFwcC50aW1lVG9IdG1sKGRheXNUbywgZGF5cyk7XG4gICAgICAgIEFwcC50aW1lVG9IdG1sKGhvdXJzVG8sIGhvdXJzKTtcbiAgICAgICAgQXBwLnRpbWVUb0h0bWwobWludXRlc1RvLCBtaW51dGVzKTtcblxuICAgICAgfVxuICAgICAgc2V0SW50ZXJ2YWwodGltZXIsIDEwMDApO1xuXG4gICAgfSxcbiAgICB0aW1lVG9IdG1sOiBmdW5jdGlvbiAoY29udGFpbmVyLCB0aW1lKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gY29udGFpbmVyW2ldO1xuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gdGltZS50b1N0cmluZygpW2ldO1xuICAgICAgfVxuICAgIH0sXG4gICAgaW5pdFBvcHVwOiBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBvdmVybGF5ID0gJChcIi5qcy1vdmVybGF5XCIpO1xuICAgICAgY29uc3QgcG9wVXBCbG9jayA9ICQoXCIuanMtcG9wdXBcIik7XG5cbiAgICAgICQoXCIuanMtc2hvdy1wb3BVcFwiKS5jbGljayhmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3QgX3RoaXMgPSAkKHRoaXMpO1xuXG4gICAgICAgIGNvbnN0IGRhdGUgPSBfdGhpcy5wYXJlbnQoJy5uZXh0LWl0ZW0nKS5maW5kKCcuanMtZGF0ZScpLnRleHQoKTtcbiAgICAgICAgY29uc3QgcGxhY2UgPSBfdGhpcy5wYXJlbnQoJy5uZXh0LWl0ZW0nKS5maW5kKCcuanMtcGxhY2UnKS50ZXh0KCk7XG5cbiAgICAgICAgcG9wdXBDb250ZW50LnByZXBlbmQoQXBwLmNyZWF0ZVBvcHVwQ29udGVudChkYXRlLCBwbGFjZSkpO1xuXG4gICAgICAgIGNvbnN0IHRhcmdldCA9ICQoX3RoaXMuZGF0YShcInRhcmdldFwiKSk7XG4gICAgICAgIHRhcmdldC50b2dnbGVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgb3ZlcmxheS5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcblxuICAgICAgfSk7XG4gICAgICAkKFwiLmpzLWNsb3NlLCAuanMtb3ZlcmxheVwiKS5jbGljayhmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IF90aGlzID0gJCh0aGlzKTtcbiAgICAgICAgY29uc3QgdGl0bGUgPSBfdGhpcy5zaWJsaW5ncyhwb3B1cENvbnRlbnQpLmZpbmQoJy5wb3B1cC1tZWV0dXBfX3R0bCcpO1xuICAgICAgICB0aXRsZS5odG1sKCcgJyk7XG4gICAgICAgIHBvcFVwQmxvY2sucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgIG92ZXJsYXkucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNyZWF0ZVBvcHVwQ29udGVudDogZnVuY3Rpb24gKGRhdGUsIHBsYWNlKSB7XG4gICAgICBjb25zdCBwb3B1cFRpdGxlID0gYDxwIGNsYXNzPVwicG9wdXAtbWVldHVwX190dGxcIj7Ql9Cw0YDQtdCz0LjRgdGC0YDQuNGA0L7QstCw0YLRjNGB0Y8g0L3QsCDRgdGF0L7QtNC60YMgQWZmaHViICR7cGxhY2V9LDxici8+IDxzcGFuIGNsYXNzPVwiZGF0ZVwiPiR7ZGF0ZX08L3NwYW4+PC9wPmA7XG4gICAgICByZXR1cm4gcG9wdXBUaXRsZTtcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIEFwcC5zbGlkZXJFdmVudHMoKTtcbiAgICAgIEFwcC5pbml0UG9wdXAoKTtcbiAgICAgIEFwcC5jcmVhdGVQb3B1cENvbnRlbnQoKTtcbiAgICAgIEFwcC5zY3JvbGxUb1RhcmdldChcIi5qcy1pdGVtLXNjcm9sbFwiLCA3MDApO1xuICAgICAgQXBwLmJ1cmdlck1lbnVTaG93KCk7XG4gICAgICBBcHAubGFiZWxGb3JtQWN0aXZlKCk7XG4gICAgICAvLyBBcHAuYWRkRm9ybVN1Ym1pdEV2ZW50KCk7XG4gICAgICBBcHAuZGV0ZWN0QW5pbWF0aW9uQmxvY2tzKCk7XG4gICAgICBBcHAuc2Nyb2xsRXZlbnQoKTtcbiAgICAgIEFwcC5hbmltYXRlQWJvdXRCbG9jaygpO1xuICAgICAgQXBwLmFuaW1hdGVHYWxsZXJ5KCk7XG4gICAgICBpZiAoJCh3aW5kb3cpLndpZHRoKCkgPCA5MDApIHtcbiAgICAgICAgJChcIi5zbGlkZXJcIikuZmFkZUluKDUwMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkKFwiLnNsaWRlclwiKS5mYWRlT3V0KDUwMCk7XG4gICAgICB9XG4gICAgICBBcHAuc2xpZGVyR2FsbGVyeSgpO1xuICAgICAgQXBwLnNsaWRlclJldmlld3MoKTtcbiAgICAgIEFwcC50aW1lck1lZXR1cCgpO1xuICAgIH1cbiAgfTtcbn0pKCksXG4gIHJlZ2lzdGVyID0gZXZlbnQgPT4ge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY2xlYXJFcnJvcnMoKTtcbiAgICBjb25zdCBmb3JtRGF0YUVycm9ycyA9IFtdLFxuICAgICAgZm9ybUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZWdpc3RyYXRpb25fZm9ybVwiKTtcbiAgICB2YXIgZGF0YSA9IHt9O1xuICAgIG5ldyBGb3JtRGF0YShmb3JtRWwpLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIGlmICh2YWx1ZSkgZGF0YVtrZXldID0gdmFsdWU7XG4gICAgfSk7XG4gICAgIS8oW0EtWmEtetCQLdCv0ITQhtCH0LAt0Y/RlNGW0ZddKSskL2cudGVzdChkYXRhLm5hbWUpICYmXG4gICAgICBmb3JtRGF0YUVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6IFwibmFtZVwiLFxuICAgICAgICBtYWVzc2FnZTogZGF0YS5uYW1lID8gXCLQndC10LrQvtGA0YDQtdC60YLQvdC+0LUg0LjQvNGPXCIgOiBcItCY0LzRjyDQvtCx0Y/Qt9Cw0YLQtdC70YzQvdC+XCJcbiAgICAgIH0pO1xuICAgIChkYXRhLnBob25lICYmICEvWzAtOSsoKS1cXHNdezUsfS9nLnRlc3QoZGF0YS5waG9uZSkpICYmXG4gICAgICBmb3JtRGF0YUVycm9ycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6IFwicGhvbmVcIixcbiAgICAgICAgbWFlc3NhZ2U6IFwi0J3QtdC60L7RgNGA0LXQutGC0L3Ri9C5INC90L7QvNC10YAg0YLQtdC70LXRhNC+0L3QsFwiXG4gICAgICB9KTtcbiAgICAoZGF0YS50ZWxlZ3JhbSAmJiAhL1xcQD9bXFxkXFx3XXs1LH0vZy50ZXN0KGRhdGEudGVsZWdyYW0pKSAmJlxuICAgICAgZm9ybURhdGFFcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiBcInRlbGVncmFtXCIsXG4gICAgICAgIG1hZXNzYWdlOiBcItCd0LXQutC+0YDRgNC10LrRgtC90YvQuSDRgtC10LvQtdCz0YDQsNC8INC70L7Qs9C40L1cIlxuICAgICAgfSk7XG4gICAgKCFkYXRhLnBob25lICYmICFkYXRhLnRlbGVncmFtKSAmJlxuICAgICAgZm9ybURhdGFFcnJvcnMucHVzaCh7XG4gICAgICAgIGZpZWxkOiBcInBob25lXCIsXG4gICAgICAgIG1hZXNzYWdlOiBcItCd0L7QvNC10YAg0YLQtdC70LXRhNC+0L3QsCDQuNC70Lgg0YLQtdC70LXQs9GA0LDQvCDQu9C+0LPQuNC9INC+0LHRj9C30LDRgtC10LvQtdC9XCJcbiAgICAgIH0pO1xuICAgIGlmIChmb3JtRGF0YUVycm9ycy5sZW5ndGgpIHJldHVybiBoYW5kbGVGb3JtRXJyb3JzKGZvcm1EYXRhRXJyb3JzKTtcbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiBcImh0dHBzOi8vZGFzaGJvYXJkLmV2ZXJhZC5jb20vdjIvYWZmaHViL2FwcGxpY2FudHNcIixcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIGJlZm9yZVNlbmQ6IHN3aXRjaEJ1dHRvbigpXG4gICAgfSlcbiAgICAgIC5kb25lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2xlYXJGaWVsZHMoKTtcbiAgICAgICAgc3dpdGNoVGhhbmtzTWVzc2FnZSgpO1xuICAgICAgfSlcbiAgICAgIC5mYWlsKGZ1bmN0aW9uICgpIHsgfSlcbiAgICAgIC5hbHdheXMoZnVuY3Rpb24gKCkge1xuICAgICAgICBzd2l0Y2hCdXR0b24oKTtcbiAgICAgIH0pO1xuICB9LFxuICBoYW5kbGVGb3JtRXJyb3JzID0gZXJyb3JzID0+IHtcbiAgICBlcnJvcnMuZm9yRWFjaChlcnJvciA9PiB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgJHtlcnJvci5maWVsZH1fZXJyb3JgKS5pbm5lckhUTUwgPVxuICAgICAgICBlcnJvci5tYWVzc2FnZTtcbiAgICB9KTtcbiAgfSxcbiAgY2xlYXJFcnJvcnMgPSAoKSA9PiB7XG4gICAgY29uc3QgZXJyb3JFbGVtZW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJmb3JtX2Vycm9yXCIpO1xuICAgIGZvciAobGV0IGVsIG9mIGVycm9yRWxlbWVudHMpIGVsLmlubmVySFRNTCA9IG51bGw7XG4gIH0sXG4gIGNsZWFyRmllbGRzID0gKCkgPT4ge1xuICAgIGZvciAobGV0IGlucHV0IG9mIGRvY3VtZW50XG4gICAgICAuZ2V0RWxlbWVudEJ5SWQoXCJyZWdpc3RyYXRpb25fZm9ybVwiKVxuICAgICAgLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5wdXRcIikpXG4gICAgICBpbnB1dC52YWx1ZSA9IG51bGw7XG4gIH0sXG4gIHN3aXRjaEJ1dHRvbiA9ICgpID0+IHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxuICAgICAgXCJmb3JtX19idG5cIlxuICAgIClbMF0uZGlzYWJsZWQgPSAhZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImZvcm1fX2J0blwiKVswXS5kaXNhYmxlZDtcbiAgfSxcbiAgc3dpdGNoVGhhbmtzTWVzc2FnZSA9IGV2ZW50ID0+IHtcbiAgICBpZiAoIWV2ZW50KSB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW4tZm9ybVwiKS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICByZXR1cm4gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGhhbmtzLWZvcm0tbWVzc2FnZVwiKS5zdHlsZS5kaXNwbGF5ID1cbiAgICAgICAgXCJibG9ja1wiKTtcbiAgICB9XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aGFua3MtZm9ybS1tZXNzYWdlXCIpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW4tZm9ybVwiKS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICB9O1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG4gIEFwcC5pbml0KCk7XG4gIHZhciBpLCBjLCB5LCB2LCBuO1xuICB2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInlvdXR1YmVcIik7XG4gIGZvciAobiA9IDA7IG4gPCB2Lmxlbmd0aDsgbisrKSB7XG4gICAgeSA9IHZbbl07XG4gICAgaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gICAgaS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCJodHRwOi8vaS55dGltZy5jb20vdmkvXCIgKyB5LmlkICsgXCIvaHFkZWZhdWx0LmpwZ1wiKTtcbiAgICBpLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIFwidGh1bWJcIik7XG4gICAgYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgYy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInBsYXlcIik7XG4gICAgeS5hcHBlbmRDaGlsZChpKTtcbiAgICB5LmFwcGVuZENoaWxkKGMpO1xuICAgIHkub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcbiAgICAgIGEuc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvXCIgKyB0aGlzLmlkICsgXCI/YXV0b3BsYXk9MSZhdXRvaGlkZT0xJmJvcmRlcj0wJndtb2RlPW9wYXF1ZSZlbmFibGVqc2FwaT0xXCIpO1xuICAgICAgYS5zdHlsZS53aWR0aCA9IHRoaXMuc3R5bGUud2lkdGg7XG4gICAgICBhLnN0eWxlLmhlaWdodCA9IHRoaXMuc3R5bGUuaGVpZ2h0O1xuICAgICAgdGhpcy5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChhLCB0aGlzKVxuICAgIH1cbiAgfVxufSk7XG4iXSwiZmlsZSI6Im1haW4uanMifQ==
