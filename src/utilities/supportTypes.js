export const supportTypes = Object.freeze({
  general: Object.freeze({
    label: 'General Support',
    categoryConfigKey: 'ticketCategoryId',
  }),
  internal_affairs: Object.freeze({
    label: 'Internal Affairs Support',
    categoryConfigKey: 'internalAffairsSupportCategoryId',
  }),
  supervisory: Object.freeze({
    label: 'Internal Affairs Support',
    categoryConfigKey: 'internalAffairsSupportCategoryId',
  }),
  management: Object.freeze({
    label: 'Management Support',
    categoryConfigKey: 'managementSupportCategoryId',
  }),
  partnership: Object.freeze({
    label: 'Partnership Support',
    categoryConfigKey: 'partnershipSupportCategoryId',
  }),
});

export function getSupportType(ticketType) {
  return supportTypes[ticketType] ?? null;
}

export function getSupportCategoryId(config, ticketType) {
  const supportType = getSupportType(ticketType);
  return supportType ? config[supportType.categoryConfigKey] : null;
}
