(() => {
  'use strict';

  const STORAGE_KEY = 'bearops.v1.tasks';
  const SEED_VERSION_KEY = 'bearops.current-list.version';
  const CURRENT_LIST_VERSION = '2026-09-14-v1';

  const rawTasks = [
    { id:'seed_frscati_metal', title:'Obtain Feral feedback and place the metal order', project:'Frascati', type:'Order', priority:'high', focus:true, notes:'Colour and sizes confirmed. Rough measure completed. Allow 8–10 weeks. Progress invoice/payment with Damian so metal can be ordered; Feral feedback still required.' },
    { id:'seed_troutbeck_painter', title:'Organise painter / painting work', project:'Troutbeck', type:'Installation', notes:'Painter / painting work remains to be coordinated.' },
    { id:'seed_taney_date', title:'Obtain confirmed date and arrange fitting', project:'Taney Road', type:'Installation', priority:'high', focus:true, notes:'A confirmed date is still required and fitting needs to be organised.' },
    { id:'seed_liam_survey', title:'Complete or follow up the site survey', project:'Liam Boggle / Boyle', type:'Survey', priority:'high', notes:'Handwritten notes reference both Monday 6/9/26 and the 9th. The date is ambiguous, so no deadline has been imposed.' },
    { id:'seed_matthew_powder', title:'Speak to Matthew regarding powder coating', project:'Powder Coating' },
    { id:'seed_ernestas_paint', title:'Follow up regarding paint issues', project:'Ernestas', type:'Snag' },
    { id:'seed_sean_regan', title:'Follow up with Sean Regan', project:'Sean Regan' },
    { id:'seed_line_bringup', title:'Clarify and follow up the “Line bring-up” item', project:'Needs Review', type:'Admin', priority:'low', notes:'Wording is unclear in the 9 September handwritten list. Confirm what this item refers to before actioning it.' },
    { id:'seed_om_manual', title:'Progress the O&M manual with Viking and Sokolka', project:'O&M Manual', type:'Admin' },
    { id:'seed_racecourt_survey', title:'Organise a survey', project:'Racecourt', type:'Survey' },
    { id:'seed_sutton_robot', title:'Organise the glass robot', project:'Sutton', type:'Installation', priority:'high' },
    { id:'seed_mandy_followup', title:'Follow up after pricing was sent', project:'Mandy Prunty', status:'waiting', waitingOn:'Client', waitingSince:'2026-09-09', notes:'Pricing was completed and sent; this is now a follow-up item.' },
    { id:'seed_duffy_price', title:'Prepare the new price', project:'Michael Duffy', type:'Pricing', notes:'Appointment was already set; latest note calls for a new price.' },
    { id:'seed_pac_milltown', title:'Follow up with Niamh on PAC Studios / Milltown', project:'PAC Studios / Milltown' },
    { id:'seed_eamon_outstanding', title:'Establish what remains to be completed', project:'Eamon Cooney', notes:'Specifically check flooring and painting.' },
    { id:'seed_rostrevor_david', title:'Work through rooflight item with David before Feral', project:'Rostrevor Rooflight', priority:'high', dueDate:'2026-09-10', notes:'9 September note says work with David first, then Feral Thursday. Retained as overdue until resolved; not marked as waiting until ownership is confirmed.' },
    { id:'seed_glenlion_bars', title:'Clarify bars / door-change item', project:'Glenlion', type:'Snag', priority:'low', notes:'Handwritten note reads roughly “Bars? Door changed!” — confirm the exact required action.' },
    { id:'seed_jimfox_cills', title:'Order cills', project:'Jim Fox', type:'Order', priority:'high' },
    { id:'seed_dmvf_email', title:'Clarify and complete the D.M.V.F. email item', project:'Needs Review', type:'Email', priority:'low', notes:'Initials are unclear in the handwritten note. Confirm the project/client before sending anything.' },
    { id:'seed_windsor_meeting', title:'Arrange a meeting with Marguerite', project:'Windsor Terrace', priority:'high', focus:true },
    { id:'seed_spot_checkers', title:'Clarify the “Spot checkers” item', project:'Needs Review', type:'Admin', priority:'low', notes:'Wording from the handwritten note is unclear.' },
    { id:'seed_sheppard_fitting', title:'Confirm delivery position/issues and sort fitting plans', project:'Sheppard', type:'Installation', priority:'high', notes:'The handwritten list also says a date was confirmed; verify the live delivery date before arranging fitting.' },
    { id:'seed_cills_powder', title:'Confirm cills have gone to the powder coater', project:'Powder Coating', priority:'high', dueDate:'2026-09-08', notes:'The handwritten note carries 8/9/26. Kept overdue so it is not missed if still outstanding.' },
    { id:'seed_niamh_transport', title:'Organise transport / lifting for the upcoming job', project:'Niamh Curtain', type:'Installation', priority:'high', notes:'Carry-forward from the earlier crane/transport action and the 9 September list.' },
    { id:'seed_adrian_materials', title:'Order materials and lock the design', project:'Adrian Sandham', type:'Order', priority:'high' },
    { id:'seed_gareth_signoff', title:'Send Gareth Morgan a sign-off', project:'Gareth Morgan', type:'Email' },
    { id:'seed_force_meter', title:'Review force-meter instructions', project:'Technical / Force Meter', type:'Admin' },
    { id:'seed_sergio_packs', title:'Prepare fitting packs for Sergio jobs', project:'Sergio Jobs', type:'Installation', priority:'high' },
    { id:'seed_keogh_report', title:'Send the Eurostyle report', project:'Keogh', type:'Email', priority:'high' },
    { id:'seed_colin_cladding', title:'Resolve / issue the cladding detail', project:'Colin Fee', priority:'high' },
    { id:'seed_loretto_survey', title:'Arrange / complete survey with Dave', project:'Loretto House', type:'Survey', priority:'high' },
    { id:'seed_templates_measure', title:'Measure the templates in stores', project:'Stores / Templates', type:'Survey' },
    { id:'seed_warrenpoint_drawings', title:'Review / progress Warrenpoint drawings with David and Damian', project:'Warrenpoint', type:'Admin', priority:'high', notes:'Carry-forward from the prior master list; no completion was recorded.' },
    { id:'seed_viking_commercial', title:'Chase the Viking-recommended commercial project', project:'Viking Commercial', type:'Follow-up', notes:'Carry-forward from the prior master list; no completion was recorded.' },
    { id:'seed_forklift_training', title:'Obtain an update on forklift training / accreditation', project:'Forklift Training', type:'Admin', priority:'high', notes:'Carry-forward from the prior master list; accreditation and insurance suitability were still unresolved.' },
    { id:'seed_laura_details', title:'Clarify the outstanding Laura item', project:'Needs Review', type:'Admin', priority:'low', notes:'Older master list retained this item as waiting for detail. No completion was recorded.' },
    { id:'seed_burton_followup', title:'Follow up the Burton Project', project:'Mark Fry / Burton Project', type:'Follow-up', notes:'Carry-forward from the prior master list; no completion was recorded.' },
    { id:'seed_pac_cpd', title:'Progress the PAC Studios CPD item', project:'PAC Studios', type:'Admin', notes:'Separate carry-forward item from the earlier master list; no completion was recorded.' },
    { id:'seed_dunlop_details', title:'Send sliding-door and front/back-door details', project:'Dunlop', type:'Email', priority:'high', notes:'Carry-forward item previously marked high priority; no completion was recorded.' },
    { id:'seed_dunlop_pack', title:'Prepare the complete fitting pack', project:'Dunlop', type:'Installation', priority:'high', notes:'Carry-forward item previously marked high priority; no completion was recorded.' }
  ];

  function currentTasks() {
    const stamp = new Date().toISOString();
    return rawTasks.map((t, index) => ({
      id: t.id || `current_${index + 1}`,
      title: t.title,
      project: t.project || '',
      type: t.type || 'Follow-up',
      priority: t.priority || 'normal',
      status: t.status || 'open',
      dueDate: t.dueDate || '',
      dueTime: '',
      reminderDate: '',
      reminderTime: '',
      waitingOn: t.waitingOn || '',
      waitingSince: t.waitingSince || '',
      chaseDate: t.chaseDate || '',
      repeat: 'none',
      focus: t.focus === true,
      notes: t.notes || '',
      createdAt: stamp,
      updatedAt: stamp,
      completedAt: ''
    }));
  }

  function writeCurrentList() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTasks()));
    localStorage.setItem(SEED_VERSION_KEY, CURRENT_LIST_VERSION);
  }

  // Fresh installs get the current work list. Existing local BearOps data is preserved.
  if (localStorage.getItem(STORAGE_KEY) === null) writeCurrentList();

  window.BearOpsSeed = {
    version: CURRENT_LIST_VERSION,
    currentTasks,
    writeCurrentList
  };
})();
