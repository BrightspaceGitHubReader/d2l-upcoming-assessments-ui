/* global describe, it, expect, fixture, beforeEach, afterEach, sinon */

'use strict';

describe('d2l upcoming assessments behavior', function() {
	var component, sandbox, token, getToken, userUrl, getRejected, getNoken;

	beforeEach(function() {
		component = fixture('d2l-upcoming-assessments-behavior-fixture');
		sandbox = sinon.sandbox.create();
		token = 'iamatoken';
		getToken = function() {
			return Promise.resolve(token);
		};
		getRejected = function() {
			return Promise.reject(new Error('Rejected rejected denied'));
		};
		getNoken = function() {
			return Promise.resolve(null);
		};
		userUrl = 'iamauser';
		component._makeRequest = sandbox.stub().returns(Promise.resolve());
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('_getUserActivityUsagesInfos', function() {
		var assignmentName = 'this is the assignment name';
		var assignmentDueDate = '2017-07-27T18:54:00.000Z';
		var assignmentHref = '/path/to/assignment';
		var organizationName = 'this is the organization name';
		var organizationHref = '/path/to/org';
		var quizHref = '/path/to/quiz';
		var overdueUserActivityUsages;
		var baseUserActivityUsage = {
			class: ['activity', 'user-assignment-activity'],
			entities: [{
				class: ['due-date'],
				properties: {
					date: assignmentDueDate
				},
				rel: ['https://api.brightspace.com/rels/date']
			}, {
				class: ['end-date'],
				properties: {
					date: assignmentDueDate
				},
				rel: ['https://api.brightspace.com/rels/date']
			}],
			links: [{
				rel: ['self'],
				href: '/path/to/user/assignment/usage'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: organizationHref
			}, {
				rel: ['https://api.brightspace.com/rels/assignment'],
				href: assignmentHref
			}],
			rel: ['https://activities.api.brightspace.com/rels/user-activity-usage']
		};
		var baseQuizUserActivityUsage = {
			class: ['activity', 'user-quiz-activity'],
			entities: [{
				class: ['due-date'],
				properties: {
					date: assignmentDueDate
				},
				rel: ['https://api.brightspace.com/rels/date']
			}, {
				class: ['end-date'],
				properties: {
					date: assignmentDueDate
				},
				rel: ['https://api.brightspace.com/rels/date']
			}],
			links: [{
				rel: ['self'],
				href: '/path/to/user/quiz/usage'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: organizationHref
			}, {
				rel: ['https://api.brightspace.com/rels/assignment'],
				href: quizHref
			}],
			rel: ['https://activities.api.brightspace.com/rels/user-activity-usage']
		};
		var assignmentEntity = {
			properties: {
				name: assignmentName
			},
			links: [{
				rel: ['self'],
				href: assignmentHref
			}],
			class: ['assignment'],
			rel: ['https://assignments.api.brightspace.com/rels/assignment']
		};
		var quizEntity = {
			properties: {
				name: assignmentName
			},
			links: [{
				rel: ['self'],
				href: quizHref
			}],
			class: ['quiz'],
			rel: ['https://quizzes.api.brightspace.com/rels/quiz']
		};
		var organizationEntity = {
			properties: {
				name: organizationName
			},
			links: [{
				rel: ['self'],
				href: organizationHref
			}]
		};

		function makeUserActivityUsagesEntity(userActivityUsages) {
			return window.D2L.Hypermedia.Siren.Parse({
				entities: userActivityUsages
			});
		}

		beforeEach(function() {
			component._fetchEntity = sandbox.stub().returns(Promise.resolve({}));
			overdueUserActivityUsages = makeUserActivityUsagesEntity([]);
		});

		it('should make no requests to _fetchEntity if there are no user activity usage entities', function() {
			var userActivityUsages = makeUserActivityUsagesEntity([]);
			return component._getUserActivityUsagesInfos(userActivityUsages, overdueUserActivityUsages, getToken, userUrl)
				.then(function() {
					expect(component._fetchEntity).to.not.have.been.called;
				});
		});

		it('should make a request to _fetchEntity for the assignment link', function() {
			var userActivityUsages = makeUserActivityUsagesEntity([baseUserActivityUsage]);

			component._fetchEntity.withArgs(assignmentHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
			);
			component._fetchEntity.withArgs(organizationHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsagesInfos(userActivityUsages, overdueUserActivityUsages, getToken, userUrl)
				.then(function() {
					expect(component._fetchEntity).to.have.been.calledWith(assignmentHref);
				});
		});

		it('should make a request to _fetchEntity for the organization link', function() {
			var userActivityUsages = makeUserActivityUsagesEntity([baseUserActivityUsage]);

			component._fetchEntity.withArgs(assignmentHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
			);
			component._fetchEntity.withArgs(organizationHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsagesInfos(userActivityUsages, overdueUserActivityUsages, getToken, userUrl)
				.then(function() {
					expect(component._fetchEntity).to.have.been.calledWith(organizationHref);
				});
		});

		it('should set the response name, courseName, dueDate, and endDate property values correctly with an assignment', function() {
			var userActivityUsages = makeUserActivityUsagesEntity([baseUserActivityUsage]);

			component._fetchEntity.withArgs(assignmentHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
			);
			component._fetchEntity.withArgs(organizationHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsagesInfos(userActivityUsages, overdueUserActivityUsages, getToken, userUrl)
				.then(function(response) {
					expect(response[0].name).to.equal(assignmentName);
					expect(response[0].courseName).to.equal(organizationName);
					expect(response[0].dueDate).to.equal(assignmentDueDate);
					expect(response[0].endDate).to.equal(assignmentDueDate);
				});
		});

		it('should set the response name, courseName, dueDate, and endDate property values correctly with a quiz', function() {
			var userActivityUsages = makeUserActivityUsagesEntity([baseQuizUserActivityUsage]);

			component._fetchEntity.withArgs(quizHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(quizEntity)
			);
			component._fetchEntity.withArgs(organizationHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsagesInfos(userActivityUsages, overdueUserActivityUsages, getToken, userUrl)
				.then(function(response) {
					expect(response[0].name).to.equal(assignmentName);
					expect(response[0].courseName).to.equal(organizationName);
					expect(response[0].dueDate).to.equal(assignmentDueDate);
					expect(response[0].endDate).to.equal(assignmentDueDate);
				});
		});

		it('should set the response instructions value to the assignment instructionsText if provided', function() {
			var userActivityUsages = makeUserActivityUsagesEntity([baseUserActivityUsage]);

			var instructionsText = 'this is the instructions text';
			var assignmentEntityWithInstructions = JSON.parse(JSON.stringify(assignmentEntity));
			assignmentEntityWithInstructions.properties.instructionsText = instructionsText;
			assignmentEntityWithInstructions.properties.instructions = 'some other text';

			component._fetchEntity.withArgs(assignmentHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntityWithInstructions)
			);
			component._fetchEntity.withArgs(organizationHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsagesInfos(userActivityUsages, overdueUserActivityUsages, getToken, userUrl)
				.then(function(response) {
					expect(response[0].instructions).to.equal(instructionsText);
				});
		});

		it('should set the response instructions value to the assignment instructions if instructionsText is not provided', function() {
			var userActivityUsages = makeUserActivityUsagesEntity([baseUserActivityUsage]);

			var instructions = 'these are the instructions';
			var assignmentEntityWithInstructions = JSON.parse(JSON.stringify(assignmentEntity));
			assignmentEntityWithInstructions.properties.instructions = instructions;

			component._fetchEntity.withArgs(assignmentHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntityWithInstructions)
			);
			component._fetchEntity.withArgs(organizationHref, getToken, userUrl).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsagesInfos(userActivityUsages, overdueUserActivityUsages, getToken, userUrl)
				.then(function(response) {
					expect(response[0].instructions).to.equal(instructions);
				});
		});
	});

	describe('_fetchEntity', function() {

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
