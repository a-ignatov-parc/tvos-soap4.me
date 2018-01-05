import * as TVDML from 'tvdml';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(TVDML.render(() => (
    <document>
      <alertTemplate>
        <title>Hello world</title>
      </alertTemplate>
    </document>
  )));
