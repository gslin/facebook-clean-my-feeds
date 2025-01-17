(function () {

    // - pattern for finding sponsored text - no numbers in text (with 2 exceptions - "1 hour" in hebrew and malaylam)
    const pattern = /([0-9]|[\u0660-\u0669]|שעה אחת|ഒരു മണിക്കൂർ|^$)/;

    let methodFound = 0;
    let extraComment = '';
    let rule1 = '';
    let rule2 = '';

    const postContainer = 'span[id="ssrb_feed_start"] ~ div > div';
    const upward = ':upward(span[id="ssrb_feed_start"] ~ div > div)';
    const highlight = ':style(border:5px dotted pink !important; width:66% !important;)';
    const live = ':style(width:0 !important; height:0 !important;)';


    // -- try various methods ..

    // -- try shadow root method:
    // - get collection of shadow-root's reference elements
    let elementsSVGText = Array.from(document.querySelectorAll('div > svg > text[id]'));
    if (elementsSVGText.length > 0) {

        // - collection of widths for sponsored text
        let arWidths = [];

        // - look for the sponsored text and get the widths
        elementsSVGText.forEach((el) => {
            if (el.textContent.length > 0) {
                // - have some text, grab it
                let daText = el.textContent;
                // - fb sometimes use ASCII code 160 for whitespace ... and trim it
                daText = daText.replaceAll(String.fromCharCode(160), String.fromCharCode(32)).trim();
                // - see if is sponsored (based on text not having a number - will get the odd false positive - e.g. "just now")
                //let 
                if (!pattern.test(daText)) {
                    // - found sponsored (with 99% confidence)
                    let elPostSVGUse = document.querySelector(`span[id] > span > span > a[href] span > span > svg > use[*|href="#${el.id}"]:not([href])`);
                    if (elPostSVGUse) {
                        // get width of the USE's grand parent element
                        let bcr = elPostSVGUse.closest('span').getBoundingClientRect();
                        let intWidth = parseInt(bcr.width, 10); // rounds down
                        let roundWidth = Math.round(bcr.width); // rounds up/down
                        // console.info('----***:', daText, bcr.width, intWidth, roundWidth, elPostSVGUse);
                        if (intWidth > 0) {
                            arWidths.push(intWidth);
                            arWidths.push(roundWidth);
                        }
                    }
                }
            }
        });
        if (arWidths.length > 0) {
            // have some widths, let add some buffer numbers
            arWidths.sort();
            let arWidthsRange = []
            arWidths.forEach((n) => {
                // arWidthsRange.push(n, n - 2, n - 1, n + 1, n + 2); // - the -2 & +2 tend to cause a few false-positives (dates formatted as: dd mmmmmm)
                arWidthsRange.push(n, n - 1, n + 1);
            });
            arWidthsRange.sort();
            // console.info('--- ::', arWidthsRange);
            let uniqueWidths = [...new Set(arWidthsRange)];
            uniqueWidths.sort((a, b) => a - b);
            // console.info('----:: unique:', uniqueWidths);

            methodFound = 1;
            extraComment = 'NB: There is a small chance that there will be some false positives, as the rule is detecting if a certain element has a certain width.\n\n';

            // - filter for uBO:
            const filterComment1 = '! FB - sponsored text (Sept 2022) *** IN TEST MODE - highlights post that met a certain criteria ***\n';
            const filterComment2 = '! FB - sponsored text (Sept 2022)\n';
            const filterBegin = `facebook.com##${postContainer} > div:not([class]) span[id] > span > span > a[href="#"] span > span:has( > svg > use[*|href]:not([href])):matches-css(width:/^(`;
            const filterEnd = `)(\.|p)/i)${upward}`;

            rule1 = filterComment1 + filterBegin + uniqueWidths.join('|') + filterEnd + highlight;
            rule2 = filterComment2 + filterBegin + uniqueWidths.join('|') + filterEnd + live;
        }

    }
    else {

        // - simple / non-abfuscated
        let elements = Array.from(document.querySelectorAll(postContainer + 'span > span > span > a[href="#"] > span, span > span > span > a[href*="/ads/"] > span'));
        if (elements.length > 0) {

            methodFound = 2;
            extraComment = 'nb: You will need two rules as FB sometimes changes the A tag\'s value.';

            const filterComment1 = '! FB - sponsored text (non-obfuscated) *** IN TEST MODE - highlights post that met a certain criteria ***\n';
            const filterComment2 = '! FB - sponsored text (non-obfuscated)\n';

            rule1 = filterComment1 + `facebook.com##${postContainer} > div:not([class]) span > span > span > a[href="#"] > span${upward}${highlight}\n` +
                                     `facebook.com##${postContainer} > div:not([class]) span > span > span > a[href*="/ads/"] > span${upward}${highlight}`;
            
            rule2 = filterComment2 + `facebook.com##${postContainer} > div:not([class]) span > span > span > a[href="#"] > span${upward}${live}\n` +
                                     `facebook.com##${postContainer} > div:not([class]) span > span > span > a[href*="/ads/"] > span${upward}${live}`;

        }
    }

    if (methodFound > 0) {

        let logText = 'The following filter rules are for spotting FB\'s Sponsored posts use. To be used with uBlock Origin.\n\n';
        if (extraComment.length > 0) {
            logText += extraComment;
        }
        logText += 'Copy the appropriate line(s) into uBO\'s "My filters" tab.\n\n\n';

        logText += 'This rule is in TEST MODE - it highlights posts that met a certain criteria\n\n';
        logText += rule1 + '\n\n\n';

        logText += 'This rule is in LIVE MODE - it hides the posts\n\n';
        logText += rule2 + '\n\n';

        console.clear();
        console.info(logText);
    }
    else {

        console.clear();
        console.info('--- Unable to create a "Sponsored" filter for use in uBO. Did you see one?');
    }
})();
