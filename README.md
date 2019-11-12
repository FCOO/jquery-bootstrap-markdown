# jquery-bootstrap-markdown
>


## Description
Read, convert, and displays markdown-files using [jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap)

Using [showdown](http://demo.showdownjs.com/) to convert from markdown to html

All internal links (e.q. `<a href="#demo">Go to demo</a>`) are converted to `scrollTo` to avoid altering the main url

### Multi-language
*jquery-bootstrap-markdown* supports special language-tags to allow multi languages in same md-file
The languages must be given in `options` (see below) and *jquery-bootstrap-markdown* will remove the not-selected language-tags

#### Example

	<da># Dette er overskriften</da><en># This is the header</en>
	<da>Dette er første afsnit...</da>
	<en>This is first section...</en>

### Link to other md-files
*jquery-bootstrap-markdown* supports special link-tags to allow link to other md-files.

    <link url="...">Text</link>

#### Example

	<da>Klik <link url="another_file.txt">her</link> for at se en anden fil</da>
	<en>Click <link url="another_file.txt">here</link> to see another file</en>

## Installation
### bower
`bower install https://github.com/FCOO/jquery-bootstrap-markdown.git --save`

## Demo
http://FCOO.github.io/jquery-bootstrap-markdown/demo/ 

## Usage

	var myBsMarkdown = $.bsMarkdown( options );
	var myBsModal = myBsMarkdown.asBsModal();
	myBsModal.show();
	//OR
	$.bsMarkdown( options ).asBsModal( true );


### options
| Id | Type | Default | Description |
| :--: | :--: | :-----: | --- |
| `url`| string | null | Url to the markdown-file |
| `link` | string | null | Url to standalone version (html) of the file |
| `icons` | `object` | `{externalLink: 'fa-external-link'}` | Class-names for icons on link-button |
| `languages` | `[]string` | `['en', 'da']` | List of possible language-codes in the md-file |
| `language` | `string` | `"en"` | Current language-code |
| `reset` | boolean | `true` | If true the modal go back to the original file when it is closed => The first file is displayed when the modal reopens |
| `header`, `fixedContent`, `footer`, `loading` | | | Options for bsModal. See [jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap) |
| `extraWidth` | `boolean` | `false` | See options for [jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap) |


### Methods

    .asBsModal(); //Create and returns a bsModal displaying the markdown-file

	.load(); //(re-)load the content
    .load(url); //load new content
	.setLanguage( language ); //Change the language

## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/jquery-bootstrap-markdown/LICENSE).

Copyright (c) 2017 [FCOO](https://github.com/FCOO)

## Contact information

NielsHolt nho@fcoo.dk