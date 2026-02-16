require 'xcodeproj'

project_path = '/Users/rompragasa/Documents/AntiGravity Projects/Origin Command/OriginCommand.xcodeproj'
begin
  project = Xcodeproj::Project.open(project_path)
rescue => e
  puts "Error opening project: #{e}"
  exit 1
end

target = project.targets.find { |t| t.name == 'OriginCommand' }
unless target
  puts "Target OriginCommand not found"
  exit 1
end

main_group = project.main_group['OriginCommand']
unless main_group
  main_group = project.main_group
end

files = [
  ['Models', 'OriginCommand/Models/AppError.swift'],
  ['Models', 'OriginCommand/Models/DevicePreferences.swift'],
  ['Managers', 'OriginCommand/Managers/PersistenceManager.swift'],
  ['Managers', 'OriginCommand/Managers/ErrorHandler.swift'],
  ['Managers', 'OriginCommand/Managers/BluOSAPIClient.swift'],
  ['Managers', 'OriginCommand/Managers/HapticManager.swift']
]

files.each do |group_name, filename|
  subgroup = main_group[group_name]
  unless subgroup
    subgroup = main_group.new_group(group_name)
  end
  
  file_ref = subgroup.files.find { |f| f.path == filename }
  unless file_ref
    file_ref = subgroup.new_reference(filename)
    puts "Ref created: #{filename}"
  end
  
  unless target.source_build_phase.files_references.include?(file_ref)
    target.source_build_phase.add_file_reference(file_ref)
    puts "Added to target: #{filename}"
  end
end

project.save
puts "Done"
