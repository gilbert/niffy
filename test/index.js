/*jshint esnext:true*/

var debug = require('debug')('niffy:test');
var should = require('chai').should();
var Niffy = require('..');

describe('Google', function () {
  var niffy

  before(function () {
    niffy = new Niffy(
      'https://google.com',
      'https://google.co.jp',
      { show: true }
    )
  })

  it('Homepage', function () {
    return niffy.goto('/').screenshot('google-home')
  })

  it('Services', function () {
    return niffy.goto('/services').screenshot('google-services')
  })

  after(function () {
    return niffy.end()
  })
})
