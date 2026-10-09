/* ==========================================================================
   دیجی‌بیت مارکت — صفحه «به‌زودی»
   Countdown to the launch moment.
   Vanilla JS, no dependencies. Target date is configured in index.html
   (window.DIGIBIT.target).
   ========================================================================== */

(function () {
    'use strict';

    var config = window.DIGIBIT || {};

    /* ---------------------------------------------------------------------
       Helpers
       --------------------------------------------------------------------- */

    // Latin digits -> Persian digits (fallback when Intl is unavailable)
    var PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

    function toPersian(value) {
        return String(value).replace(/\d/g, function (d) {
            return PERSIAN_DIGITS[Number(d)];
        });
    }

    var numberFormatter = null;
    if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
        try {
            numberFormatter = new Intl.NumberFormat('fa-IR');
        } catch (e) {
            numberFormatter = null;
        }
    }

    // Format a number with Persian digits and no grouping separators,
    // padded to at least two characters.
    function formatUnit(number) {
        var text;
        if (numberFormatter) {
            numberFormatter.useGrouping = false;
            try {
                text = numberFormatter.format(number);
            } catch (e) {
                text = toPersian(number);
            }
        } else {
            text = toPersian(number);
        }
        return text.length < 2 ? toPersian('0') + text : text;
    }

    /* ---------------------------------------------------------------------
       Target date resolution
       --------------------------------------------------------------------- */

    // Preview mode: a short, always-future countdown so both the running
    // timer and the "launched" state can be verified in seconds.
    var PREVIEW_SECONDS = 30;

    function resolveTarget() {
        if (config.preview) {
            return Date.now() + PREVIEW_SECONDS * 1000;
        }

        // Optional override so the launch date can be changed without editing
        // code, e.g. index.html?target=2027-06-01T00:00:00Z
        var override = null;
        try {
            override = new URLSearchParams(window.location.search).get('target');
        } catch (e) {
            override = null;
        }

        var raw = override || config.target;
        var parsed = raw ? Date.parse(raw) : NaN;

        if (isNaN(parsed)) {
            // Misconfigured or missing target: never show a broken timer,
            // fall back to 30 days from the first visit to this page.
            parsed = Date.now() + 30 * 24 * 60 * 60 * 1000;
        }

        return parsed;
    }

    /* ---------------------------------------------------------------------
       Countdown
       --------------------------------------------------------------------- */

    function initCountdown() {
        var hero = document.getElementById('hero');
        var countdown = document.getElementById('countdown');

        if (!hero) {
            return;
        }

        var fields = {
            days: document.getElementById('cd-days'),
            hours: document.getElementById('cd-hours'),
            minutes: document.getElementById('cd-minutes'),
            seconds: document.getElementById('cd-seconds')
        };

        if (!countdown || !fields.days || !fields.hours || !fields.minutes || !fields.seconds) {
            return;
        }

        var target = resolveTarget();
        var timerId = null;

        function markLaunched() {
            hero.classList.add('is-launched');
            if (timerId !== null) {
                window.clearInterval(timerId);
                timerId = null;
            }
        }

        function render() {
            var remaining = target - Date.now();

            if (remaining <= 0) {
                fields.days.textContent = formatUnit(0);
                fields.hours.textContent = formatUnit(0);
                fields.minutes.textContent = formatUnit(0);
                fields.seconds.textContent = formatUnit(0);
                markLaunched();
                return;
            }

            var totalSeconds = Math.floor(remaining / 1000);

            var days = Math.floor(totalSeconds / 86400);
            var hours = Math.floor((totalSeconds % 86400) / 3600);
            var minutes = Math.floor((totalSeconds % 3600) / 60);
            var seconds = totalSeconds % 60;

            fields.days.textContent = formatUnit(days);
            fields.hours.textContent = formatUnit(hours);
            fields.minutes.textContent = formatUnit(minutes);
            fields.seconds.textContent = formatUnit(seconds);
        }

        render();

        if (target - Date.now() > 0) {
            timerId = window.setInterval(render, 1000);
        }
    }

    /* ---------------------------------------------------------------------
       Footer year (current Jalali year via the browser's Persian calendar)
       --------------------------------------------------------------------- */

    function initFooterYear() {
        var target = document.getElementById('footer-year');
        if (!target) {
            return;
        }

        var year = null;
        if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
            try {
                var formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' });
                year = formatter.format(new Date());
            } catch (e) {
                year = null;
            }
        }

        if (year) {
            target.textContent = year;
        }
    }

    /* ---------------------------------------------------------------------
       Boot
       --------------------------------------------------------------------- */

    function boot() {
        initCountdown();
        initFooterYear();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
