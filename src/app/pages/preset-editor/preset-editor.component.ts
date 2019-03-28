import { Component, OnInit, ViewChild, ElementRef, OnDestroy }
  from '@angular/core';
import { MatDialog } from '@angular/material';

import { Observable, Subscription } from 'rxjs';
import { Store, select } from '@ngrx/store';

import * as fromReducers from '../../root-reducer';
import * as fromSelectors from './preset-editor.selectors';
import * as exerciseSelectors
  from 'src/app/components/exercise-editor/exercise-editor.selectors';
import { Preset } from 'src/app/models/preset.model';
import { Exercise } from 'src/app/models/exercise.model';
import { ExerciseEditorComponent }
  from 'src/app/components/exercise-editor/exercise-editor.component';
import * as countdonwSelectors
  from '../../components/countdown/countdown.selectors';
import { PresetService } from '../../helpers/preset.service';
import { ExerciseService } from 'src/app/helpers/exercise.service';
import { CountdownService } from 'src/app/helpers/countdown.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { sortBySeqNo }
  from '../../components/exercise-editor/exercise-editor.reducer';
import { DialogOptions, DialogTitleTypes }
  from 'src/app/models/dialog-options.model';
import { ShareService } from 'src/app/helpers/share.service';
import { TextCopyComponent } from 'src/app/components/text-copy/text-copy.component';
import { Countdown } from 'src/app/models/countdown.model';


@Component({
  selector: 'jt-preset-editor',
  templateUrl: './preset-editor.component.html',
  styleUrls: ['./preset-editor.component.css']
})
export class PresetEditorComponent implements OnInit, OnDestroy {
  preset: Preset;
  exercises$: Observable<Exercise[]>;
  editingTitle: boolean;
  editingRepetitions: boolean;
  presetSubscription: Subscription;

  @ViewChild('titleInput') titleInput: ElementRef<HTMLInputElement>;
  @ViewChild('repetitionsInput') repetitionsInput: ElementRef<HTMLInputElement>;
  exercises: Exercise[];
  exercisesSubscription: Subscription;
  countdownsSubscription: Subscription;
  countdowns: Countdown[];
  optionsIsVisible: boolean = false;

  constructor(
    private store: Store<fromReducers.State>,
    private dialog: MatDialog,
    private pHelper: PresetService,
    private eHelper: ExerciseService,
    private cHelper: CountdownService,
    private ar: ActivatedRoute,
    private router: Router,
    private share: ShareService
  ) { }

  ngOnInit() {
    this.ar.queryParamMap
      .subscribe((paramMap: ParamMap) => {
        const presetId = paramMap.get('pId');

        this.presetSubscription = this.store
          .pipe(
            select(fromSelectors.selectPreset(presetId))
          )
          .subscribe(preset => {
            if (preset) {
              this.preset = preset;
              this.exercisesSubscription = this.store
                .pipe(
                  select(exerciseSelectors.allExercisesOfPreset(this.preset.id))
                ).subscribe(exercises => {
                  this.exercises = exercises.sort(sortBySeqNo);
                });
              this.countdownsSubscription = this.store
                .pipe(
                  select(countdonwSelectors.allCountdownsOfExercises(this.preset.exercisesIds))
                )
                .subscribe(countdowns => this.countdowns = countdowns)
            }
          });

        this.presetSubscription.add(this.exercisesSubscription);
        this.presetSubscription.add(this.countdownsSubscription);
      });

  }

  ngOnDestroy() {
    this.presetSubscription.unsubscribe();
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.exercises, event.previousIndex, event.currentIndex);
    this.exercises.forEach((ex, i) => {
      ex.seqNo = i;
      this.eHelper.updateExercise(ex);
    })
  }

  deletePreset(preset) {
    this.pHelper.deletePreset(preset);
    this.router.navigate(['/home']);
  }

  onBlur(prop, val) {
    this.editProperty(prop, false);
    this.pHelper.updatePreset(this.preset.id, {
      [prop]: this.chechValue(prop, val)
    });
  }

  editProperty(prop, edit = true) {
    switch (prop) {
      case 'title':
        this.editingTitle = edit;
        break;
      case 'repetitions':
        this.editingRepetitions = edit;
        break;
    }
  }

  chechValue(prop, value) {
    let res;

    switch (prop) {
      case 'title':
        res = value;
        break;
      case 'repetitions':
        const v: number = Math.abs(+value);
        if (v) {
          res = Math.floor(v);
          res = res ? res : 1;
        } else {
          res = 1;
        }
        break;
    }

    return res;
  }

  newExercise() {
    const exercise = this.eHelper.getBlank(this.preset.id);
    const options: DialogOptions = {
      title: DialogTitleTypes.NewExercise,
      isNew: true
    };
    exercise.seqNo = this.exercises.length;
    this.openDialog(exercise, options);
  }

  editExercise(ex) {
    const exercise = Object.assign({}, ex);
    const options: DialogOptions = {
      title: DialogTitleTypes.EditExercise,
      isNew: false
    };

    this.openDialog(exercise as Exercise, options);
  }

  private openDialog(exercise: Exercise, opts: { title, isNew }): void {
    const dref = this.dialog
      .open(ExerciseEditorComponent, {
        autoFocus: opts.isNew,
        data: {
          exercise,
          opts
        }
      });

    const drefSubs = dref.afterClosed().subscribe(data => {
      if (!data) return;

      const { exercise, countdowns, deletedCountdowns } = data;

      if (deletedCountdowns.length) {
        this.cHelper.removeCountdowns(exercise.id, deletedCountdowns);
      }

      if (!opts.isNew) {
        this.eHelper.updateExercise(exercise);
      } else if (opts.isNew) {
        this.eHelper.addExercise(exercise, this.preset.id);
      }

      this.cHelper.upsertCountdowns(exercise.id, countdowns);

      drefSubs.unsubscribe();
    });
  }

  sharePreset(): void {

    this.showOptions();

    let data: string = this.share.construct(this.preset, this.exercises, this.countdowns)
    data = btoa(encodeURI(data));

    const sended = this.share.preset(data, this.preset.title);

    if (typeof sended !== 'boolean') {
      sended
        .then(() => console.log('Successful share'))
        .catch((error) => {
          this.openLinkDialog(data);
          console.log('Error sharing', error)
        })
    } else {
      this.openLinkDialog(data);
    }
  }

  openLinkDialog(data) {
    this.dialog.open(TextCopyComponent, {
      height: '10rem',
      width: '80%',
      data: { link: `${new URL(document.location.href).origin}/export?preset=${data}` }
    })
  }

  showOptions() {
    this.optionsIsVisible = !this.optionsIsVisible
  }

  deleteExercise(id) {
    this.eHelper.removeExercise(id, this.preset.id);
    this.exercises.forEach((ex, i) => ex.seqNo = i)
  }

  getCountdownsBy(exerciseId) {
    return this.store.pipe(
      select(countdonwSelectors.allExerciseCountdowns(exerciseId))
    );
  }
}
