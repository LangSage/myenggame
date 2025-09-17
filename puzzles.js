// puzzles.js
// Generic puzzle handlers; currently supports 'sequence' puzzles with optional requiresSign

export function setupPuzzles(ctx){
  // placeholder: could register per-level state
}

export function handlePropInteraction({ctx, prop, key, placeKey, setDoorClosed}){
  // Sign behavior (activate sequence if required)
  if(prop.name==='Sign' && ctx.puzzle?.requiresSign){
    ctx.state.seqActive = true;
    ctx.state.seqIndex = 0;
    return ctx.sayRand(ctx.hints.Sign || ctx.generic);
  }

  const puzzle = ctx.puzzle;
  if(!puzzle){
    return ctx.sayRand(ctx.generic);
  }

  if(puzzle.type === 'sequence'){
    if(puzzle.requiresSign && !ctx.state.seqActive){
      return ctx.sayRand(ctx.generic);
    }
    const expected = puzzle.order[ctx.state.seqIndex];
    if(prop.name === expected){
      ctx.state.seqIndex++;
      ctx.sayRand((ctx.hints[prop.name]) || ctx.generic);
      if(ctx.state.seqIndex === puzzle.order.length){
        ctx.state.seqActive = false; ctx.state.seqIndex = 0;
        // complete
        if(puzzle.onComplete?.spawnKey){
          key.visible = true;
          placeKey(puzzle.onComplete.spawnKey);
        }
        if(puzzle.onComplete?.message){
          ctx.say(puzzle.onComplete.message);
        }
      }
    } else if (puzzle.order.includes(prop.name)){
      ctx.state.seqIndex = 0;
      ctx.say('…nothing happens. Maybe the order is wrong.');
    } else {
      ctx.sayRand(ctx.generic);
    }
    return;
  }

    if(puzzle.type === 'lever_sequence'){
    // Steps: pull Lever (close door) -> SignStart -> SignRed -> SignGreen
    if(prop.name==='Lever'){
      ctx.state.leverOn = true;
      if(setDoorClosed) setDoorClosed(true); // close door to make it harder
      return ctx.say(ctx.hints?.Lever?.[0] || 'You pull the lever. Something closes in the distance.');
    }
    if(!ctx.state.leverOn){
      return ctx.say('A lever somewhere must be switched first.');
    }
    // require starting sign to arm the sequence
    if(prop.name==='SignStart'){
      ctx.state.seqActive = true; ctx.state.seqIndex = 0;
      return ctx.say(ctx.hints?.SignStart?.[0] || 'The sign points toward a red sign…');
    }
    if(!ctx.state.seqActive){
      return ctx.say('The sign is unreadable… maybe another sign comes first?');
    }
    const order = puzzle.order || ['SignStart','SignRed','SignGreen'];
    const expected = order[ctx.state.seqIndex+1]; // after SignStart
    if(['SignRed','SignGreen'].includes(prop.name)){
      if(prop.name===expected){
        ctx.state.seqIndex++;
        ctx.say(ctx.hints?.[prop.name]?.[0] || 'Good. Keep going.');
        if(ctx.state.seqIndex+1 >= order.length){
          ctx.state.seqActive=false; ctx.state.seqIndex=0;
          if(puzzle.onComplete?.spawnKey){
            key.visible = true; placeKey(puzzle.onComplete.spawnKey);
          }
          if(puzzle.onComplete?.message) ctx.say(puzzle.onComplete.message);
        }
      } else {
        ctx.state.seqIndex = 0;
        ctx.say('Out of order. Try again from the first sign.');
      }
      return;
    }
    return ctx.say('Not helpful right now.');
  }

  // future puzzle types here...

  ctx.sayRand(ctx.generic);
}
