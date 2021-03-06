import { Injectable } from '@angular/core';

import { Exercise } from '../models/exercise.model';
import { AddExercise, DeleteExercise, UpdateExercise }
  from '../components/exercise-editor/exercise-editor.actions';
import { Store } from '@ngrx/store';
import * as fromReducers from '../root-reducer';
import { RelatedDataManagerService } from './related-data-manager.service';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {

  getBlank(presetId): Exercise {
    return {
      id: Date.now(),
      title: 'untitled',
      color: '#ffcd06',
      countdownsIds: [],
      seqNo: 0,
      repetitions: 1,
      atStartOnly: false,
      atEndOnly: false,
      presetRepetitions: true,
      belongsToPresets: [presetId]
    }
  }

  public addExercise(exercise, presetId): void {
    this.store.dispatch(new AddExercise({ exercise }));
    this.rdm.onExerciseAdd(presetId);
  }

  public removeExercise(id, presetId): void {
    this.store.dispatch(new DeleteExercise({ id }));
    this.rdm.onExerciseRemove(presetId, id);
  }

  public updateExercise(exercise): void {
    this.store.dispatch(new UpdateExercise({
      exercise: {
        id: exercise.id,
        changes: { ...exercise }
      }
    }));
  }

  constructor(
    private store: Store<fromReducers.State>,
    private rdm: RelatedDataManagerService
  ) { }
}
