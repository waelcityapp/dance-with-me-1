const fs = require('fs');

let content = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const targetEnd = `                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
`;
const replaceEnd = `                      );
                    })()}
                  </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
`;

content = content.replace(targetEnd, replaceEnd);

fs.writeFileSync('src/components/profile/ProfileView.tsx', content);
console.log('done2');
