#!/usr/bin/env bash
set -euo pipefail

: "${ORDERKO_ALB_ARN:?Set ORDERKO_ALB_ARN to the Application Load Balancer ARN.}"
: "${ORDERKO_LISTENER_RULE_ARN:?Set ORDERKO_LISTENER_RULE_ARN to the orderko.org listener rule ARN.}"
: "${ORDERKO_DOMAIN_HOST:?Set ORDERKO_DOMAIN_HOST, for example orderko.org.}"

AWS_REGION="${AWS_REGION:-us-east-1}"
HEALTHY_TARGET_GROUP_ARN=""

for target_group_arn in $(aws elbv2 describe-target-groups \
  --load-balancer-arn "$ORDERKO_ALB_ARN" \
  --region "$AWS_REGION" \
  --query "TargetGroups[].TargetGroupArn" \
  --output text); do
  target_health="$(aws elbv2 describe-target-health \
    --target-group-arn "$target_group_arn" \
    --region "$AWS_REGION" \
    --query "TargetHealthDescriptions[0].TargetHealth.State" \
    --output text)"

  if [ "$target_health" = "healthy" ]; then
    HEALTHY_TARGET_GROUP_ARN="$target_group_arn"
  fi
done

if [ -z "$HEALTHY_TARGET_GROUP_ARN" ]; then
  echo "No healthy target group found. Do not update the listener rule." >&2
  exit 1
fi

echo "Forwarding $ORDERKO_DOMAIN_HOST to healthy target group:"
echo "$HEALTHY_TARGET_GROUP_ARN"

aws elbv2 modify-rule \
  --rule-arn "$ORDERKO_LISTENER_RULE_ARN" \
  --conditions "Field=host-header,Values=$ORDERKO_DOMAIN_HOST" \
  --actions "Type=forward,TargetGroupArn=$HEALTHY_TARGET_GROUP_ARN" \
  --region "$AWS_REGION"
