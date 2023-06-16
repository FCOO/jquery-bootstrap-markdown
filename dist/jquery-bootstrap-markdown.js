/****************************************************************************
	jquery-bootstrap-markdown.js,

	(c) 2017, FCOO

	https://github.com/FCOO/jquery-bootstrap-markdown
	https://github.com/FCOO

****************************************************************************/

(function ($, window/*, document, undefined*/) {
	"use strict";

    var currentBsMarkdown = null;

    /******************************************************
    SHOWDOWN
    Creating extensions and setting default options and plugins
    See https://github.com/showdownjs/showdown/wiki/Showdown-Options for details

    ******************************************************/
    var showDownExtensions = [];
    function addExtension( name, ext ){
        window.showdown.extension(name, ext);
        showDownExtensions.push(name);
    }

    //Add extentions to add default class-names to tags.
    var classMap = {
        table: 'table table-striped table-hover table-bordered table-responsive',
        h1    : 'd-none', //Hide header
        //td   : 'text-nowrap'
    };
    addExtension('bindings',
            Object.keys(classMap).map(function( key ){
                return {
                    type: 'output',
                    regex: new RegExp('<'+key , 'g'),
                    replace: '<' + key + ' class="' + classMap[key] + '"'
                };
            })
    );
/* ES6
    addExtension('bindings',
            Object.keys(classMap).map(key => ({
                type: 'output',
                regex: new RegExp(`<${key}`, 'g'),
                replace: `<${key} class="${classMap[key]}"`
            }))
    );
*/
    //Replace all internal href (href="#ID") with a javascript-function to scroll the element into view - prevent hashtags in the main window
    window._showdownScrollToElement = function( _this ){
        var id = $(_this).data('showdownscrollto'),
            $elem = id ? $('#'+id) : null;
        if ($elem && $elem.length)
            $elem.scrollIntoView();
    };
    addExtension('scrollTo',{
        type: 'output',
        regex: /<a\s+href="\#/g,
        replace: '<a href="javascript:undefined" onClick="javascript:_showdownScrollToElement(this);" data-showdownscrollto="'
    });

    //Force all href to go to new window
    addExtension('hrefTarget', {
        type: 'output',
        regex: /<a\s+href="/g,
        replace: '<a target="_blank" href="'
    });

    //Convert all relative paths to absolute path using the path of the md-file
    addExtension('relativetoabsolute', {
        type: 'output',
        filter: function (text, converter/*, options*/) {
            var tags = [
                    {start: 'url(', end:')'},
                    {start: 'src="', end:'"'}
                ],
                path = converter.getOption('url').split('/');
            path.pop();
            path = path.join('/');

            $.each( tags, function( index, tag ){
                var list = text.split( tag.start );
                $.each( list, function( index, subStr ){
                    if (index){
                        var subStrList = subStr.split( tag.end ),
                            url = subStrList[0];

                        //Convert relative url by adding the path of the md-file
                        if (url.indexOf('http') != 0){
                            subStrList[0] = path + (url.charAt(0) == '/' ? '' : '/') + url;
                            list[index] = subStrList.join( tag.end );
                        }
                    }
                });
                text = list.join( tag.start );
            });
            return text;
        }
    });


    //Convert >link url="...">text</link> to <a> calling load()
    window._showdownLink = function( elem ){
        if (currentBsMarkdown)
            currentBsMarkdown.load(elem.dataset.url);
    };

    addExtension('linkTargetEnd', {
        type: 'output',
        regex: /<\/link>/g,
        replace: '</a>'
    });
    addExtension('linkTarget', {
        type: 'output',
        regex: /<link\s+url="/g,
        replace: '<a href="javascript:undefined" onClick="javascript:_showdownLink(this);" data-url="'
    });




    //Default showdown options
    var showdownOptions = {
            extensions                          : showDownExtensions,
            simplifiedAutoLink                  : true, //Enable automatic linking in plain text urls
            excludeTrailingPunctuationFromURLs  : true, //Excludes trailing punctuation from autolinked urls
            literalMidWordUnderscores           : true, //Treats underscores in middle of words as literal characters
            strikethrough                       : true, //Enable support for strikethrough syntax
            tables                              : true, //Enable support for tables syntax
            takslists                           : true, //Enable support for GFM takslists
            ghMentions                          : true, //Enable support for github @mentions
            simpleLineBreaks                    : true, //Parse line breaks as <br/> in paragraphs (like GitHub does)
        };

    /******************************************************
    BsMarkdown
    ******************************************************/
    function BsMarkdown( options ) {
		this.options = $.extend({}, {
            url         : '',
            link        : '',           //Url to standalone version of the file
            languages   : ['en', 'da'], //List of possible language-codes in the md-file. E.q. <da>Dette er på dansk</de><en>This is in English</en>
            language    : 'en',         //Current language-code
            reset       : true,        //If true the modal go back to original file when it is closed => The first file is displayed when the modal reopens

            header      : '',
            fixedContent: null,         //fixed content for the modal-window
            footer      : null,         //footer for the modal-window
            loading     : null,         //Default icon and text displayed in the modal-window during loading
            icons       : {
                externalLink: 'fa-external-link'
            }
		}, options || {} );


        this.content = '';
        this.$loading =
            this.options.loading ?
                $('<div/>')
                    .addClass('text-center')
            .css('margin', 'auto auto')
                    ._bsAddHtml( this.options.loading )
            : null;


        //Craete historyList to hole all loaded files
        this.historyList = new window.HistoryList({
            action   : $.proxy( this.load, this ),
        });

        this.options.language = this.options.language || this.options.languages[0];
    }

    // expose access to the constructor
    $.BsMarkdown = BsMarkdown;

    $.bsMarkdown = function( options ){
        return new $.BsMarkdown( options );
    };

	//Extend the prototype
	$.BsMarkdown.prototype = {
        /****************************************************
        Load content
        ****************************************************/
        load: function( url, historyList ){
            if (!historyList){
                //load called directly => add to historyList
                this.historyList.add( url );
                return;
            }

            var _this = this;

            this.content = '';
            this.options.url = url || this.options.url;

            //Add 'loading...' to modal (if any)
            if (this.$modalContainer){
                //Preserve the height of the modal during loading
                var $parent = this.$modalContainer.parent(),
                    cHeight = this.$modalContainer.height(),
                    pHeight = $parent.outerHeight(true);
                if (cHeight)
                    $parent.css('height', pHeight+'px');

                this.$modalContainer
                    .empty()
                    .append( this.$loading );
            }
            window.Promise.getText(
                _this.options.url, {
                    resolve: _this._resolve.bind(_this),
                    reject : _this._reject.bind(_this)
            }
            );
        },

        _resolve: function( content ){
            this.content = content;
            this.$modalContainer.empty();

            //Convert content (if any) to html OR use header as content
            this.converter = this.converter || new window.showdown.Converter(showdownOptions);
            this.converter.setOption('url', this.options.url);

            this.$modalContainer.append(
                this.converter.makeHtml(
                    this._adjustLanguage( this.content, this.options.language )
                )
            );

            //Remove fixed height set during loading
            this.$modalContainer.parent().css('height', 'initial');
        },


        _reject: function(){
            //If no expected content was loaded => go back to previous file (if any) or close the modal-window
            var closeModal = (this.historyList.index <= 0);
            if (this.historyList.index >= 0){
                this.historyList.goBack();
                this.historyList.clearFuture();
            }
            if (closeModal)
                this.bsModal.close();
        },

        _onClose: function(){
            currentBsMarkdown = this.previousBsMarkdown;
            this.previousBsMarkdown = null;

            if (this.options.reset){
                //Reset and go back to original url
                this.content = null;
                this.options.url = this.historyList.list[0];
                //Reset historyList
                this.historyList.list = [];
                this.historyList.index = -1;
                this.historyList.lastIndex = -1;
            }
        },

        /**********************************************
        asBsModal - return a bsModal with all messages
        **********************************************/
        asBsModal: function( show ){
            var _this = this;

            this.bsModal = this.bsModal ||
                $.bsModal({
                    header  : this.options.header,
                    show    : false,
                    fixedContent : this.options.fixedContent,
                    flexWidth    : true,
                    extraWidth   : this.options.extraWidth,
//                    noVerticalPadding
                    content      : '&nbsp;',//function( $container ){ _this.$modalContainer = _this.$modalContainer || $container; },
                    scroll       : true,

                    historyList: this.historyList,

                    onChange: function(){
                        //Save currentBsMarkdown and sets _this as current
                        if (currentBsMarkdown !== _this){
                            _this.previousBsMarkdown = currentBsMarkdown;
                            currentBsMarkdown = _this;
                        }
                    },

                    onClose: function(){
                        _this._onClose();
                        return true;
                    },
/*
                    extended: {
                        fixedContent
                        flexWidth
                        extraWidth: true,
                        noVerticalPadding
                        content
                        scroll: boolean | 'vertical' | 'horizontal'
                        footer
                    }
                    isExtended: boolean
*/
                    footer  : this.options.footer,

                    buttons : this.options.link ? [{
                                 icon   : this.options.icons.externalLink,
                                 text   : {da:'Vis i nyt vindue', en:'Show in new window'},
                                 onClick: function(){
                                              var win = window.open(_this.options.link, '_blank');
                                              win.focus();
                                          }
                              }] : [],
//                    closeText
                });

            this.$modalContainer = this.$modalContainer || this.bsModal.bsModal.$content;

            if (this.options.reset || (this.historyList.lastIndex <= 0)){
                //Hide back- and forward-icons
                this.bsModal.getHeaderIcon('back').css('visibility', 'hidden');
                this.bsModal.getHeaderIcon('forward').css('visibility', 'hidden');
            }

            if (show)
                this.bsModal.show();

            if (!this.content)
                this.load( this.options.url );

            return this.bsModal;
        },

        /****************************************************
        Language
        ****************************************************/
        //_adjustLanguage - Remove contents in <en>..</en> in danish versions and <da>..</da> in english versions and remove the tags <da> and </da> TODO: Skal gøre de forskellige dele skjulte
        _adjustLanguage: function( src, lang ){

            //Remove contents in <xx>..</xx> where xx is any language-code in options.languages except lang
            $.each( this.options.languages, function( index, language ){
                if (language == lang)
                    return true;

                var startTag = '<' + language + '>',
                    endTag   = '</' + language + '>',
                    list     = src.split( startTag );

                $.each( list, function( index, listItem ){
                    var subList = listItem.split( endTag );
                    if (subList.length > 1)
                        subList = subList.slice(1);
                    list[index] = subList.join( endTag );
                });
                src = list.join( startTag );
            });

            //Remove all language-tags
            $.each( this.options.languages, function( index, language ){
                src = src
                        .split( '<'+language+'>')
                        .join('')
                        .split( '</'+language+'>')
                        .join('');
            });
            return src;
        },


        setLanguage: function( language ){
            this.options.language  = language;
            if (this.content)
                this.load();
        },

	};

}(jQuery, this, document));
