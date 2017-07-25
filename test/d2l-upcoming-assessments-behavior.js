/* global describe, it, expect, fixture, beforeEach, sinon */

'use strict';

describe('d2l-upcoming-assessments-behavior', function() {
	var component,
		sandbox,
		token = 'smokin-token',
		getToken = function() {
			return Promise.resolve(token);
		},
		getRejected = function() {
			return Promise.reject(new Error('Rejected rejected denied'));
		},
		getNoken = function() {
			return Promise.resolve(null);
		};

	beforeEach(function() {
		component = fixture('d2l-upcoming-assessments-behavior-consumer-fixture');
		sandbox = sinon.sandbox.create();
	});

	describe('fetching enities', function() {
		it('should not make request if getToken or url is not provided', function(done) {
			component._makeRequest = sandbox.stub();
			component._getToken = null;

			setTimeout(function(){
				component._fetchEntity('url', null, null);
				expect(component._makeRequest.called).to.be.false;

				component._fetchEntity(null, getToken, null);
				expect(component._makeRequest.called).to.be.false;

				component._getToken = null;
				component._fetchEntity(null, null, 'url');
				expect(component._makeRequest.called).to.be.false;
				done();
			});
		});

		it('should make request when getToken and url are provided', function(done) {
			component._makeRequest = sandbox.stub();
			component._fetchEntity('url', getToken, null);
			setTimeout(function() {
				expect(component._makeRequest.called).to.be.true;
				done();
			});
		});

		it('should make request when getToken, url and userUrl are provided', function(done) {
			component._makeRequest = sandbox.stub();
			component._fetchEntity('url', getToken, 'userUrl');
			setTimeout(function() {
				expect(component._makeRequest.called).to.be.true;
				done();
			});
		});

		it('should make request when getToken is previous set and url is provided', function(done) {
			component._makeRequest = sandbox.stub();
			component._getToken = getToken;
			component._fetchEntity('url', null, null);
			setTimeout(function() {
				expect(component._makeRequest.called).to.be.true;
				done();
			});
		});

		it('should not make request when getToken rejects', function(done) {
			component._makeRequest = sandbox.stub();
			component._getToken = getRejected;
			component._fetchEntity('url', null, null);
			setTimeout(function() {
				expect(component._makeRequest.called).to.be.false;
				done();
			});
		});

		it('should not make request when token is not a string', function(done) {
			component._makeRequest = sandbox.stub();
			component._getToken = getNoken;
			component._fetchEntity('url', null, null);
			setTimeout(function() {
				expect(component._makeRequest.called).to.be.false;
				done();
			});
		});
	});
});
