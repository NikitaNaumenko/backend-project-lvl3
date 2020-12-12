### Hexlet tests and linter status:
[![Actions Status](https://github.com/NikitaNaumenko/backend-project-lvl3/workflows/hexlet-check/badge.svg)](https://github.com/NikitaNaumenko/backend-project-lvl3/actions)
[![Test Coverage](https://api.codeclimate.com/v1/badges/56b52b4d6aea6c089559/test_coverage)](https://codeclimate.com/github/NikitaNaumenko/backend-project-lvl3/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/56b52b4d6aea6c089559/maintainability)](https://codeclimate.com/github/NikitaNaumenko/backend-project-lvl3/maintainability)
[![asciicast](https://asciinema.org/a/VWUSYpQboLtHFrRG1CIsnYKq2.svg)](https://asciinema.org/a/VWUSYpQboLtHFrRG1CIsnYKq2)

# Page Loader

Download any page from an internet

## Setup

clone and run
```sh
$ make install
```

## Usage

* Usage: page-loader [options] <url>

* Options:
*  -o, --output <dir>  path to uploaded path (default: current working directory)
*  -h, --help          display help for command

## Example

```sh
$ page-loader https://hexlet.io/courses -o ./hexlet-io
Page was loaded into: /Users/n.naumenko/Workspace/backend-project-lvl3/hexlet-io-courses.html

➜ find ./hexlet-io -print | sed -e 's;[^/]*/;|____;g;s;____|; |;g'
|____hexlet-io
| |____hexlet-io-courses_files
| | |____hexlet-io-courses.html
| |____hexlet-io-courses.html

```
