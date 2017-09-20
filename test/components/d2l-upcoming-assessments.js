/* global describe, it, fixture, expect, beforeEach, afterEach, sinon */

'use strict';

describe('<d2l-upcoming-assessments>', function() {

	var element;
	var nextPeriodUrl = '/some/period/beyond/now/';
	var previousPeriodUrl = '/some/period/before/now/';
	var activities = {
		properties: {
			start: '2017-07-19T16:20:07.567Z',
			end: '2017-08-02T16:20:07.567Z'
		}
	};

	beforeEach(function() {
		element = fixture('basic');
	});

	describe('smoke test', function() {

		it('can be instantiated', function() {
			expect(element.is).to.equal('d2l-upcoming-assessments');
		});

	});

	describe('fetching data', function() {

		var element;
		var sandbox;
		var server;

		beforeEach(function() {
			sandbox = sinon.sandbox.create();
			server = sinon.fakeServer.create();
			server.respondImmediately = true;

			element = fixture('basic');
			element._debounceTime = 10;
		});

		afterEach(function() {
			server.restore();
			sandbox.restore();
		});

		describe('_getInfo', function() {
			var customRangeUrl, myActivities, userEntity;

			beforeEach(function() {
				customRangeUrl = 'http://example.com?start=2017-09-20T12:00:00.000Z&end=2017-09-27T12:00:00.000Z';
				myActivities = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
				userEntity = window.D2L.Hypermedia.Siren.Parse({
					entities: [{
						rel: ['https://api.brightspace.com/rels/first-name'],
						properties: {
							name: 'foo'
						}
					}],
					links: [{
						rel: ['https://activities.api.brightspace.com/rels/my-activities'],
						href: 'http://example.com/my-activities'
					}]
				});

				element.isActivityUpcoming = sinon.stub().returns(true);
				element._fetchEntity = sinon.stub().returns(Promise.resolve(userEntity));
				element._getCustomRangeAction = sinon.stub().returns(Promise.resolve(customRangeUrl));
				element._loadActivitiesForPeriod = sinon.stub().returns(Promise.resolve(myActivities));
			});

			it('should reset the error state', function() {
				element._showError = true;

				return element._getInfo().then(function() {
					expect(element._showError).to.be.false;
				});
			});

			it('should fetch the user entity', function() {
				element.userUrl = 'http://example.com';

				return element._getInfo().then(function() {
					expect(element._fetchEntity).to.have.been.calledWith('http://example.com');
				});
			});

			it('should set the user\'s name', function() {
				return element._getInfo().then(function() {
					expect(element._userName).to.equal('foo');
				});
			});

			it('should fetch activities with a custom date range', function() {
				return element._getInfo().then(function() {
					expect(element._getCustomRangeAction).to.have.been.calledWith('http://example.com/my-activities');
				});
			});

			it('should set the total number of activities', function() {
				return element._getInfo().then(function() {
					expect(element.totalCount).to.equal(5);
				});
			});

			it('should set the stored assessments to be the first four activities', function() {
				return element._getInfo().then(function() {
					expect(element._assessments.length).to.equal(4);
				});
			});

			it('should set the error state if things go wrong', function() {
				element._loadActivitiesForPeriod = sinon.stub().returns(Promise.reject());

				return element._getInfo().then(function() {
					expect(element._showError).to.be.true;
				});
			});
		});

		describe('_goNext', function() {
			it('invokes _loadActivitiesForPeriod with the nextPeriodUrl', function() {
				element._loadActivitiesForPeriod = sandbox.stub().returns(Promise.resolve());
				element._nextPeriodUrl = nextPeriodUrl;
				return element._goNext()
					.then(function() {
						expect(element._loadActivitiesForPeriod).to.have.been.calledWith(nextPeriodUrl);
					});
			});
		});

		describe('_goPrev', function() {
			it('invokes _loadActivitiesForPeriod with the previousPeriodUrl', function() {
				element._loadActivitiesForPeriod = sandbox.stub().returns(Promise.resolve());
				element._previousPeriodUrl = previousPeriodUrl;
				return element._goPrev()
					.then(function() {
						expect(element._loadActivitiesForPeriod).to.have.been.calledWith(previousPeriodUrl);
					});
			});
		});

		describe('_loadActivitiesForPeriod', function() {

			it('does nothing if the provided url was not set', function() {
				element._fetchEntity = sandbox.stub();
				return element._loadActivitiesForPeriod()
					.then(function() {
						return Promise.reject('Expected _loadActivitiesForPeriod to reject');
					})
					.catch(function() {
						expect(element._fetchEntity).to.not.have.been.called;
					});
			});

			it('calls _fetchEntity for the provided url', function() {
				element._fetchEntity = sandbox.stub().returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(activities)
				));
				return element._loadActivitiesForPeriod(nextPeriodUrl)
					.then(function() {
						expect(element._fetchEntity).to.have.been.calledWith(nextPeriodUrl);
					});
			});

		});

		describe('_getCustomRangeAction', function() {
			it('does nothing if the provided url was not set', function() {
				element._fetchEntity = sandbox.stub();
				return element._getCustomRangeAction()
					.then(function() {
						return Promise.reject('Expected _getCustomRangeAction to reject');
					})
					.catch(function() {
						expect(element._fetchEntity).to.not.have.been.called;
					});
			});

			it('calls _fetchEntity for the provided url', function() {
				element._fetchEntity = sandbox.stub().returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(activities)
				));
				return element._getCustomRangeAction(nextPeriodUrl)
					.then(function() {
						expect(element._fetchEntity).to.have.been.calledWith(nextPeriodUrl);
					});
			});
		});

	});

});
