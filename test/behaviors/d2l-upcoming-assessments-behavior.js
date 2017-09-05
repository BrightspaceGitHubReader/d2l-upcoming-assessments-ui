/* global describe, it, expect, fixture, beforeEach, afterEach, sinon */

'use strict';

describe('d2l upcoming assessments behavior', function() {
	var component, sandbox, token, getToken, userUrl;

	function nowish(modifierDays) {
		var date = new Date();
		date.setDate(date.getDate() + modifierDays);
		return date;
	}

	function parse(entity) {
		return window.D2L.Hypermedia.Siren.Parse(entity);
	}

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		component = fixture('d2l-upcoming-assessments-behavior-fixture');
		component._makeRequest = sandbox.stub().returns(Promise.resolve());
		userUrl = 'iamauser';
		token = 'iamatoken';
		getToken = function() {
			return Promise.resolve(token);
		};
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('_getUserActivityUsagesInfos', function() {
		var completionDate, dueDate, endDate, overdueUserUsages;
		var activityHref = '/path/to/activity';
		var activityName = 'Activity Name';
		var organizationHref = '/path/to/org';
		var organizationName = 'this is the organization name';
		var organizationEntity = {
			properties: { name: organizationName },
			links: [{
				rel: ['self'],
				href: organizationHref
			}]
		};

		function getUserActivityUsage(type, isComplete) {
			var activityRel;
			if (type === 'quiz') {
				activityRel = 'https://api.brightspace.com/rels/quiz';
			} else if (type === 'assignment') {
				activityRel = 'https://api.brightspace.com/rels/assignment';
			}

			var entity = {
				class: ['activity', 'user-' + type + '-activity'],
				entities: [{
					class: ['due-date'],
					properties: { date: dueDate },
					rel: ['https://api.brightspace.com/rels/date']
				}, {
					class: ['end-date'],
					properties: { date: endDate },
					rel: ['https://api.brightspace.com/rels/date']
				}, {
					class: ['completion', isComplete ? 'complete' : 'incomplete'],
					rel: ['item'],
					entities: isComplete ? [{
						class: ['date', 'completion-date'],
						properties: {
							date: completionDate
						},
						rel: ['https://api.brightspace.com/date']
					}] : []
				}],
				links: [{
					rel: ['self'],
					href: '/href/to/userAssignmentUsage'
				}, {
					rel: ['https://api.brightspace.com/rels/organization'],
					href: organizationHref
				}, {
					rel: [activityRel],
					href: activityHref
				}],
				rel: ['https://activities.api.brightspace.com/rels/user-activity-usage']
			};

			return parse(entity);
		}

		function getActivity(type) {
			var entity = {
				class: [type],
				properties: { name: activityName },
				links: [{
					rel: ['self'],
					href: activityHref
				}],
				rel: [type === 'assignment' ? 'https://assignments.api.brightspace.com/rels/assignment' : null]
			};

			return parse(entity);
		}

		beforeEach(function() {
			completionDate = nowish(-1);
			dueDate = nowish(5);
			endDate = nowish(10);

			component._fetchEntity = sandbox.stub().returns(Promise.resolve({}));
			overdueUserUsages = parse({ entities: [] });
		});

		it('should make no requests to _fetchEntity if there are no user activity usage entities', function() {
			var userActivityUsages = parse({ entities: [] });
			return component._getUserActivityUsagesInfos(userActivityUsages, overdueUserUsages, getToken, userUrl)
				.then(function() {
					expect(component._fetchEntity).to.not.have.been.called;
				});
		});

		it('should make a request to _fetchEntity for the organization link', function() {
			var userActivityUsages = parse({ entities: [getUserActivityUsage('assignment')] });

			component._fetchEntity.withArgs(activityHref, getToken, userUrl).returns(
				getActivity('assignment')
			);
			component._fetchEntity.withArgs(organizationHref, getToken, userUrl).returns(
				parse(organizationEntity)
			);

			return component._getUserActivityUsagesInfos(userActivityUsages, overdueUserUsages, getToken, userUrl)
				.then(function() {
					expect(component._fetchEntity).to.have.been.calledWith(organizationHref);
				});
		});

		['quiz', 'assignment'].forEach(function(type) {
			var userUsage, activity, userUsages;

			describe(type, function() {
				beforeEach(function() {
					userUsage = getUserActivityUsage(type);
					activity = getActivity(type);
					userUsages = parse({ entities: [userUsage] });

					component._fetchEntity.withArgs(activityHref, getToken, userUrl).returns(
						parse(activity)
					);
					component._fetchEntity.withArgs(organizationHref, getToken, userUrl).returns(
						parse(organizationEntity)
					);
				});

				it('should make a request to _fetchEntity for the activity link', function() {
					return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
						.then(function() {
							expect(component._fetchEntity).to.have.been.calledWith(activityHref);
						});
				});

				it('should set the name, courseName, and type correctly', function() {
					return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
						.then(function(response) {
							expect(response[0].name).to.equal(activityName);
							expect(response[0].courseName).to.equal(organizationName);
							expect(response[0].type).to.equal(type);
						});
				});

				it('should set the instructions from the instructionsText property if available', function() {
					var activityWithInstructions = JSON.parse(JSON.stringify(activity));
					activityWithInstructions.properties.instructionsText = 'some text';
					activityWithInstructions.properties.instructions = 'some other text';

					component._fetchEntity.withArgs(activityHref, getToken, userUrl).returns(
						parse(activityWithInstructions)
					);

					return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
						.then(function(response) {
							expect(response[0].instructions).to.equal('some text');
						});
				});

				it('should set the instructions from the instructions property', function() {
					var activityWithInstructions = JSON.parse(JSON.stringify(activity));
					activityWithInstructions.properties.instructionsText = null;
					activityWithInstructions.properties.instructions = 'some other text';

					component._fetchEntity.withArgs(activityHref, getToken, userUrl).returns(
						parse(activityWithInstructions)
					);

					return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
						.then(function(response) {
							expect(response[0].instructions).to.equal('some other text');
						});
				});

				it('should set due date correctly', function() {
					return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
						.then(function(response) {
							expect(response[0].dueDate).to.equal(dueDate);
						});
				});

				it('should set end date correctly', function() {
					return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
						.then(function(response) {
							expect(response[0].endDate).to.equal(endDate);
						});
				});

				[true, false].forEach(function(isCompleted) {
					it('should set isCompleted correctly when activity is ' + (isCompleted ? 'complete' : 'incomplete'), function() {
						userUsage = getUserActivityUsage(type, isCompleted);
						userUsages = parse({ entities: [userUsage] });
						return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
							.then(function(response) {
								expect(response[0].isCompleted).to.equal(isCompleted);
							});
					});
				});

				[true, false].forEach(function(isDueToday) {
					it('should set isDueToday correctly when activity is ' + (isDueToday ? '' : 'not') + ' due today', function() {
						dueDate = nowish(isDueToday ? 0 : 1);
						userUsage = getUserActivityUsage(type);
						userUsages = parse({ entities: [userUsage] });
						return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
							.then(function(response) {
								expect(response[0].isDueToday).to.equal(isDueToday);
							});
					});
				});

				[true, false].forEach(function(isOverdue) {
					it('should set isOverdue correctly when activity is ' + (isOverdue ? '' : 'not') + ' overdue', function() {
						overdueUserUsages = parse({ entities: isOverdue ? [userUsage] : []});
						return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
							.then(function(response) {
								expect(response[0].isOverdue).to.equal(isOverdue);
							});
					});
				});

				[true, false].forEach(function(isEnded) {
					it('should set isEnded correctly when activity does ' + (isEnded ? '' : 'not') + ' end today', function() {
						endDate = nowish(isEnded ? -1 : 1);
						userUsage = getUserActivityUsage(type);
						userUsages = parse({ entities: [userUsage] });
						return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
							.then(function(response) {
								expect(response[0].isEnded).to.equal(isEnded);
							});
					});
				});
			});
		});
	});

	describe('_fetchEntity', function() {
		var getRejected, getNoken;

		beforeEach(function() {
			getRejected = function() {
				return Promise.reject(new Error('Rejected rejected denied'));
			};
			getNoken = function() {
				return Promise.resolve(null);
			};
		});

		[
			{ parm1: 'url', parm2: null, parm3: null },
			{ parm1: null, parm2: getToken, parm3: null },
			{ parm1: null, parm2: null, parm3: 'url'}
		].forEach(function(testcase) {
			it('should not make request if getToken or url is not provided', function() {
				component._fetchEntity(testcase.parm1, testcase.parm2, testcase.parm3);
				expect(component._makeRequest.called).to.be.false;
			});
		});

		it('should make request when getToken and url are provided', function() {
			return component._fetchEntity('url', getToken, null)
				.then(function() {
					expect(component._makeRequest.called).to.be.true;
				});
		});

		it('should make request when getToken, url and userUrl are provided', function() {
			return component._fetchEntity('url', getToken, 'userUrl')
				.then(function() {
					expect(component._makeRequest.called).to.be.true;
				});
		});

		it('should make request when getToken is previous set and url is provided', function() {
			return component._fetchEntity('url', getToken, null)
				.then(function() {
					expect(component._makeRequest.called).to.be.true;
				});
		});

		it('should not make request when getToken rejects', function() {
			return component._fetchEntity('url', getRejected, null)
				.then(function() {
					expect(component._makeRequest.called).to.be.false;
				}, function() {
					expect(component._makeRequest.called).to.be.false;
				});
		});

		it('should not make request when token is not a string', function() {
			return component._fetchEntity('url', getNoken, null)
				.then(function() {
					expect(component._makeRequest.called).to.be.false;
				}, function() {
					expect(component._makeRequest.called).to.be.false;
				});
		});
	});
});
