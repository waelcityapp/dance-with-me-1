const x = (
  <div>
    {(sub.eventRef || associatedEvent?.eventRef) && (
      <span>new stuff</span>
    )}
    {false && (
      <span>old stuff</span>
    )}
  </div>
);
