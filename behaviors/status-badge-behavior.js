import '@polymer/polymer/polymer-legacy.js';
import 'd2l-fetch-siren-entity-behavior/d2l-fetch-siren-entity-behavior.js';
import { Classes } from 'd2l-hypermedia-constants';
import './date-behavior.js';

window.D2L = window.D2L || {};
window.D2L.UpcomingAssessments = window.D2L.UpcomingAssessments || {};

/*
* @polymerBehavior window.D2L.UpcomingAssessments.StatusBadgeBehavior
*/
var statusBadgeBehaviorImpl = {
	properties: {},
	_completeState: {text: 'activityComplete', state: 'success'},
	_endedState: {text: 'activityEnded', state: 'null'},
	_exemptedState: {text: 'activityExempted', state: 'success'},
	_overdueState: {text: 'activityOverdue', state: 'alert'},
	_dueTodayState: {text: 'activityDueToday', state: 'default'},
	_endsTodayState: {text: 'activityEndsToday', state: 'default'},

	_createStatusConfig: function(isCompleted, isEnded, isExempt, isOverdue, isDueToday, endsToday) {
		var statusConfig = null;

		if (isCompleted) {
			statusConfig = this._completeState;
		} else if (isEnded) {
			statusConfig = this._endedState;
		} else if (isExempt) {
			statusConfig = this._exemptedState;
		} else if (isOverdue) {
			statusConfig = this._overdueState;
		} else if (isDueToday) {
			statusConfig = this._dueTodayState;
		} else if (endsToday) {
			statusConfig = this._endsTodayState;
		}

		return statusConfig;
	},

	_getStatusBadge: function(userActivityUsage, overdueUserUsages, typeProps) {
		var completionState = typeProps.noCompletion ? {} : this._getCompletionState(userActivityUsage);
		var exemptState = this._getExemptState(userActivityUsage);
		var dueDateState = this._getDueDateState(userActivityUsage, overdueUserUsages);
		var endDateState = this._getEndDateState(userActivityUsage);

		return {
			statusConfig: this._createStatusConfig(
				completionState.isCompleted,
				endDateState.isEnded,
				exemptState.isExempt,
				dueDateState.isOverdue,
				dueDateState.isDueToday,
				endDateState.endsToday
			),
			completionState: completionState,
			dueDateState: dueDateState,
			endDateState: endDateState
		};
	},

	_getCompletionState: function(userActivityUsage) {
		return {
			isCompleted: !!userActivityUsage.getSubEntityByClass(Classes.activities.complete)
		};
	},

	_getDueDateState: function(userActivityUsage, overdueUserActivityUsages) {
		var activityIsOverdue = false;
		var activityIsDueToday = false;
		var dueDateEntity = userActivityUsage.getSubEntityByClass(Classes.dates.dueDate);
		var dueDate;
		if (dueDateEntity) {
			dueDate = dueDateEntity.properties.date;
			activityIsDueToday = this.getDateDiffInCalendarDays(dueDate) === 0;
			activityIsOverdue = overdueUserActivityUsages.some(function(overdueUserUsage) {
				return overdueUserUsage.getLinkByRel('self').href === userActivityUsage.getLinkByRel('self').href;
			});
		}

		return {
			isOverdue: activityIsOverdue,
			isDueToday: activityIsDueToday,
			dueDate: dueDate
		};
	},

	_getEndDateState: function(dateEntity) {
		var endDateEntity = dateEntity.getSubEntityByClass(Classes.dates.endDate);
		var isEnded = false;
		var endsToday = false;
		var endDate;

		if (endDateEntity) {
			var dateDetails = this._getDateDetails(endDateEntity);
			isEnded = dateDetails.isEnded;
			endsToday = dateDetails.endsToday;
			endDate = dateDetails.date;
		}

		return {
			isEnded: isEnded,
			endsToday: endsToday,
			endDate: endDate
		};
	},

	_getExemptState: function(userActivityUsage) {
		return {
			isExempt: userActivityUsage.hasClass(Classes.activities.exempt)
		};
	},

	_getDateDetails: function(entity) {
		if (!entity) {
			return {};
		}

		var now = new Date();
		var endDate = entity.properties.date;
		var activityDate = new Date(endDate);

		return {
			isEnded: activityDate < now,
			endsToday: this.getDateDiffInCalendarDays(endDate) === 0,
			date: endDate
		};
	},
};

window.D2L.UpcomingAssessments.StatusBadgeBehavior = [
	D2L.PolymerBehaviors.FetchSirenEntityBehavior,
	window.D2L.UpcomingAssessments.DateBehavior,
	statusBadgeBehaviorImpl
];
