const fs = require('fs');

let content = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const targetStr = `                  </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
`;

const replacement = `                  </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/components/profile/ProfileView.tsx', content);
console.log('done fixed');
