import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { Character, AttributeType } from './character';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  characterState = new Character();
  forceRebirth: boolean = false;

  constructor(
    mainLoopService: MainLoopService,
    private logService: LogService,
    private reincarnationService: ReincarnationService
  ) {
    mainLoopService.tickSubject.subscribe(() => {
      this.characterState.recalculateLifespan();
      this.characterState.dead = false;
      this.characterState.age++;
      this.characterState.status.nourishment.value--;
      // check for death
      let deathMessage = "";
      if (this.forceRebirth){
        deathMessage = "You release your soul from your body.";
      } else if (this.characterState.age >= this.characterState.lifespan) {
        deathMessage = "You reach the end of your natural life and pass away from old age.";
      } else if (this.characterState.status.nourishment.value <= 0) {
        if (this.characterState.attributes.spirituality.value > 0){
          // you're spritual now, you can fast!
          this.characterState.status.health.value -= 20;
          this.characterState.increaseAttribute('spirituality', 0.1);
          if (this.characterState.status.health.value <= 0) {
            deathMessage = "You starve to death.";
          }
        } else {
          deathMessage = "You starve to death.";
        }
      } else if (this.characterState.status.health.value <= 0) {
        deathMessage = "You succumb to your wounds and die.";
      }
      if (deathMessage != ""){
        this.logService.addLogMessage(deathMessage, 'INJURY', 'REBIRTH');
        if (!this.forceRebirth){
          this.logService.addLogMessage(
            "You have failed to achieve immortality and your life has ended. Don't worry, I'm sure you'll achieve immortality in your next life.",
            'STANDARD', 'REBIRTH');
        }
        this.logService.addLogMessage(
          "Congratulations! The cycle of reincarnation has brought you back into the world. You have been born again.",
          'STANDARD', 'REBIRTH');
        this.logService.addLogMessage(
          "It takes you a few years to grow up and remember your purpose: to become an immortal. You're all grown up now, so get to it!",
          'STANDARD', 'REBIRTH');
        this.reincarnationService.reincarnate();
        this.characterState.dead = true; // use this flag to stop other events until the next tick
        this.forceRebirth = false;
      }
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.characterState.reincarnate();
      if (Math.random() < .3){
        this.logService.addLogMessage("Your father puts some coins in your purse before sending you on your way.",
          'STANDARD', 'REBIRTH');
        this.characterState.money += 100;
      }
    });

  }

  condenseSoulCore(){
    this.logService.addLogMessage("Your spirituality coelesces around the core of your soul, strengthening it and reforging it into something stronger.", 'STANDARD', 'REBIRTH');
    this.characterState.condenseSoulCoreCost *= 10;
    this.characterState.aptitudeGainDivider /= 2;
    const keys = Object.keys(this.characterState.attributes) as AttributeType[];
    for (const key in keys){
      let attribute = this.characterState.attributes[keys[key]];
      attribute.aptitude = 1;
      if (parseInt(key) < 5){
        attribute.value = 1;
      } else {
        attribute.value = 0;
      }
    }
    this.forceRebirth = true;
  }

}
